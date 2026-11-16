import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from '../scripts/build.mjs';

test('HTML autónomo, navegación interna y SEO por ruta', async () => {
  const out = await mkdtemp(join(tmpdir(),'portfolio-test-'));
  try {
    const { routes } = await build({out,origin:'https://portfolio.example',indexable:true});
    const titles = new Set();
    for (const route of routes) {
      const html = await readFile(join(out,route,'index.html'),'utf8');
      assert.equal((html.match(/<h1[ >]/g)||[]).length,1);
      assert.match(html,/<html lang="es">/);
      assert.ok(html.includes(`rel="canonical" href="https://portfolio.example${route}"`));
      assert.match(html,/<meta name="robots" content="index, follow">/);
      assert.match(html,/og:image" content="https:\/\/portfolio.example\/social-card.png/);
      titles.add(html.match(/<title>(.*?)<\/title>/)[1]);
      const json = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
      assert.equal(json['@graph'][0]['@type'],'Person');
      assert.ok(!html.includes('SportsOrganization'));
      for (const [,href] of html.matchAll(/href="(\/[^"]*)"/g)) {
        const [pathname,hash] = href.split('#');
        const target = join(out,pathname,pathname.endsWith('/')?'index.html':'');
        assert.ok((await stat(target)).isFile(),href);
        if(hash) assert.ok((await readFile(target,'utf8')).includes(`id="${hash}"`),href);
      }
    }
    assert.equal(titles.size,routes.length);
    const home = await readFile(join(out,'index.html'),'utf8');
    assert.match(home,/data-areas="Content Analyst\|Data Quality\|CMS\|QA"/);
    assert.match(home,/class="filters" hidden/);
    assert.match(home,/Contacto profesional y CV: disponibles próximamente/);
    const sitemap = await readFile(join(out,'sitemap.xml'),'utf8');
    assert.equal((sitemap.match(/<loc>/g)||[]).length,routes.length);
    assert.ok(!sitemap.includes('404') && !sitemap.includes('/admin'));
    const notFound = await readFile(join(out,'404.html'),'utf8');
    assert.match(notFound,/noindex, nofollow/);
    assert.ok(!notFound.includes('rel="canonical"') && !notFound.includes('application/ld+json'));
  } finally { await rm(out,{recursive:true,force:true}); }
});

test('Vista local sin dominios inventados; indexación exige origen válido', async () => {
  const out = await mkdtemp(join(tmpdir(),'portfolio-preview-'));
  try {
    await build({out,origin:'',indexable:false});
    const html = await readFile(join(out,'index.html'),'utf8');
    assert.match(html,/noindex, follow/);
    assert.ok(!html.includes('rel="canonical"'));
    await assert.rejects(build({out,origin:'',indexable:true}),/SITE_ORIGIN/);
    for(const origin of ['http://example.com','https://example.com/path','https://user:pass@example.com']) await assert.rejects(build({out,origin}),/HTTPS/);
  } finally { await rm(out,{recursive:true,force:true}); }
});
