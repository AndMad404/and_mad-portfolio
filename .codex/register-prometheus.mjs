import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const base = 'C:/Users/and_m/Documents/Profesional/DesarrolloAsistidoIA/.codex';
const name = 'Portafolio_And_Mad';
const roots = ['app','shared','server','connector','studio','scripts','tests','content','migrations','.github','src','public','package.json','package-lock.json','tsconfig.json','react-router.config.ts','vite.config.ts','vite.studio.config.ts','wrangler.site.jsonc','wrangler.studio.jsonc','AGENTS.md','context-index.md','dependency-index.json','ROADMAP.md','README.md','docs','.codex'];
const discovery = { mode: 'filesystem', roots };
const exclusions = ['node_modules/**','**/node_modules/**','build/**','dist/**','.wrangler/**','.react-router/**','.git/**','context-library/**','docs/legacy/**','**/*.html','**/*.png','**/*.jpg','**/*.webp','**/*.pdf','**/*.docx','package-lock.json'];
const context = {name,workdirs:[root],authorizedRoots:[root],entryIndexes:[{kind:'root-context',path:path.join(root,'context-index.md')}],repositories:[],excludeGlobs:exclusions,inventory:{indexPath:'context-library/index.md',areasPath:'context-library/areas',textExtensions:['.md','.json','.jsonc','.ts','.tsx','.js','.mjs','.css','.toml','.yml','.yaml','.sql'],maxEntriesPerShard:100,maxEstimatedTokensPerShard:500}};
const configs = [
 ['context-librarian/profile.json',context],
 ['dependency-librarian/profile.json',{name,workdirs:[root],indexPath:path.join(root,'dependency-index.json'),fileDiscovery:discovery}],
 ['dependency-editor/profile.json',{name,workdirs:[root],indexPath:'dependency-index.json',fileDiscovery:discovery,roadmap:'ROADMAP.md',evidence:'docs/prometheus.md',reminderIgnorePrefixes:['context-library/','build/','dist/','.wrangler/','.react-router/'],reminderIgnoreFiles:['dependency-index.json']}]
];
for (const [relative, entry] of configs) {
 const target=path.join(base,relative); const original=fs.readFileSync(target,'utf8'); const data=JSON.parse(original);
 if(data.projects.some(p=>p.name===name || p.workdirs?.includes(root))) throw new Error('Existing registration requires review: '+target);
 fs.writeFileSync(target+'.before-portfolio-registration.bak',original,{flag:'wx'});
 data.projects.push(entry); fs.writeFileSync(target,JSON.stringify(data,null,2)+'\n');
 console.log('Registered '+target);
}
