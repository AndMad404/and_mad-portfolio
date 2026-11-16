import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { watch } from 'node:fs';
import { spawn } from 'node:child_process';
import { resolve, extname, sep } from 'node:path';
import { root } from './build.mjs';
const out = resolve(root, 'dist');
const clients = new Set();
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8'};
const reloadScript = `<script>new EventSource('/__dev/events').addEventListener('reload', () => location.reload());</script>`;

// Cada compilación usa un proceso nuevo para evitar contenido de módulos cacheados.
function compile() {
  return new Promise((accept, reject) => {
    const child = spawn(process.execPath, ['scripts/build.mjs'], { cwd: root, stdio: ['ignore','ignore','inherit'] });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? accept() : reject(new Error(`Build terminó con código ${code}`)));
  });
}
await compile();
let compiling = false;
let pending = false;
let timer;
async function rebuild() {
  pending = true;
  if (compiling) return;
  compiling = true;
  try {
    while (pending) {
      pending = false;
      try {
        await compile();
        console.log('Portafolio actualizado.');
        for (const client of clients) client.write('event: reload\ndata: ready\n\n');
      } catch (error) { console.error('No se pudo actualizar:', error.message); }
    }
  } finally { compiling = false; }
}
const watchers = ['src', 'public', 'scripts'].map(folder => watch(resolve(root,folder), {recursive:true}, () => {
  clearTimeout(timer);
  timer = setTimeout(rebuild, 120);
}));
const server = createServer(async (req,res) => {
  try {
    if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405, {Allow:'GET, HEAD'});res.end();return;}
    const path = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if (path === '/__dev/events' && req.method === 'GET') {
      res.writeHead(200, {'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});
      res.write(': connected\n\n');
      clients.add(res);
      res.on('close', () => clients.delete(res));
      return;
    }
    let target = resolve(out,'.'+path);
    if(target !== out && !target.startsWith(out+sep)) {res.writeHead(403);res.end();return;}
    if((await stat(target)).isDirectory()) target = resolve(target,'index.html');
    let body = await readFile(target);
    if (extname(target) === '.html') body = body.toString().replace('</body>', reloadScript + '</body>');
    res.writeHead(200,{'Content-Type':mime[extname(target)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});res.end(req.method === 'HEAD' ? undefined : await readFile(resolve(out,'404.html')));}
});
const heartbeat = setInterval(() => {for (const client of clients) client.write(': heartbeat\n\n');},15000);
function shutdown() {
  clearInterval(heartbeat);
  clearTimeout(timer);
  watchers.forEach(watcher => watcher.close());
  clients.forEach(client => client.end());
  server.close();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
server.listen(Number(process.env.PORT || 4173),'127.0.0.1',()=>console.log('Portafolio: http://127.0.0.1:'+server.address().port+' — actualización automática activa'));
