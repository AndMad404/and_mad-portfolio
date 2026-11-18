import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { readFile } from "node:fs/promises";
import { createMemoryRouter, RouterProvider } from "react-router";
import Home from "../app/routes/home";
import { caseAreas, published, resolveCaseFragment, areaExperienceId, retiredPublicDestination, areaStories } from "../app/content";
import { ProjectCard } from "../app/components/ProjectCard";
import { snapshotSchema, entryPath } from "../shared/contracts";
import { nextBlockScroll, visibleNavigationSection } from "../app/components/PageMotion";
import { paperWindowPath, ownedWindowPaths } from "../app/components/BlueprintWindows";

test("cuatro controles y modales agrupan experiencias y resuelven fragmentos históricos", () => {
  const router = createMemoryRouter([{ path: "/", element: createElement(Home) }]);
  try {
    const html = renderToStaticMarkup(createElement(RouterProvider, { router }));
    const controls = [...html.matchAll(/<button[^>]*aria-haspopup="dialog"[^>]*>Conocer más<\/button>/g)];
    assert.equal(controls.length, 4);
    assert.equal([...html.matchAll(/<dialog\b/g)].length, 4);
    const expected = [
      ["operacion-cms", "sitios-wordpress"], ["fak", "sitios-wordpress"],
      ["fak", "portafolio-editorial"],
      ["auditoria-datos", "operacion-cms", "excelbatch", "cleantreeflow", "fak", "auditoria-web", "extractor-carrito"],
    ];
    caseAreas.forEach((area, index) => {
      assert.deepEqual(area.experienceIds, expected[index]);
      assert.ok(controls[index]![0].includes(`aria-label="Conocer más: ${area.label}"`));
      assert.equal(resolveCaseFragment(`#area-${area.id}`)?.area, area);
      const modal = html.match(new RegExp(`<dialog id="${area.modalId}"[\\s\\S]*?<\\/dialog>`))![0];
      assert.equal([...modal.matchAll(/<dialog\b/g)].length, 1);
      assert.ok(modal.includes(`aria-labelledby="${area.modalId}-title"`));
      assert.match(modal, /class="entry-modal entry-modal-folder"/);
      assert.equal([...modal.matchAll(/<h2\b/g)].length, 1, "Un único título en la pestaña de carpeta");
      assert.ok(modal.includes(`<h2 id="${area.modalId}-title" class="area-folder-title">${area.title}</h2>`));
      assert.ok(
        /class="area-modal-actions"><button[^>]*aria-label="Volver a los casos"><span[^>]*>Volver<\/span>\s*<svg/.test(modal),
        "El botón del modal conserva el nombre accesible, la etiqueta visible Volver y la flecha",
      );
      assert.doesNotMatch(modal, /Cerrar|×|class="entry-title"/);
      assert.ok(modal.indexOf('class="area-modal-actions"') < modal.indexOf('class="entry-parallax-window"'));

      for (const id of area.experienceIds) {
        assert.ok(modal.includes(`id="${areaExperienceId(area, id)}"`));
      }
      const story = areaStories[area.id]!;
      assert.ok(modal.includes(`<p class="area-story">${story.narrative}</p>`));
      assert.ok(modal.includes('<ul class="area-results" role="list">'));
      for (const result of story.results) assert.ok(modal.includes(`<li>${result}</li>`));
      assert.doesNotMatch(modal, /<h4|Página de esta experiencia|>Contexto<|>Mi participación<|\b(?:19|20)\d{2}\b/);
      const words = modal.replace(/<[^>]*>/g, " ").trim().split(/\s+/);
      assert.ok(words.length <= 150, `${area.id}: ${words.length} palabras, mantener lectura breve`);
      for (const link of story.links) {
        assert.ok(modal.includes(`href="${link.url}"`));
      }
    });
    for (const entry of published.entries.filter(item => item.kind === "case")) {
      const result = resolveCaseFragment(`#caso-${entry.slug}`);
      const owner = caseAreas.find(area => area.experienceIds.includes(entry.id));
      assert.equal(result?.area, owner);
      assert.equal(result?.experienceId, owner ? entry.id : undefined);
      assert.equal(retiredPublicDestination(entryPath(entry)), owner ? `/#caso-${entry.slug}` : "/#proyectos");
    }
    for (const id of ["gestor", "centrificador", "eventos-combate"]) {
      assert.ok(!caseAreas.some(area => area.experienceIds.includes(id)));
    }
    assert.equal(resolveCaseFragment("#caso-desconocido"), undefined);
    assert.equal([...html.matchAll(/class="work-type-window"/g)].length, 4);
    assert.equal([...html.matchAll(/class="entry-parallax-window"/g)].length, 4);
    assert.doesNotMatch(html, /<img\b/);
    assert.match(html, /seis años.*sector automotriz/i);
    assert.doesNotMatch(html, /area-evidence-note|experiencia (?:laboral |histórica )?declarada|estado actual no acredita|CV privado|sin material interno público|sin datos internos públicos/i);
  } finally { router.dispose(); }
});

test("portada ofrece modales etiquetados y resúmenes sin enlaces a fichas", async () => {
  const snapshot = snapshotSchema.parse(JSON.parse(await readFile("content/published.json", "utf8")));
  const router = createMemoryRouter([{ path: "/", element: createElement(Home) }]);
  try {
    const html = renderToStaticMarkup(createElement(RouterProvider, { router }));
    assert.ok(html.indexOf('id="servicios"') < html.indexOf('id="proyectos"'), "Servicios precede a Casos en el orden real del documento");
    assert.doesNotMatch(html, /id="contacto"/, "El contacto pertenece al footer compartido");
    assert.doesNotMatch(html, /UNA FICHA \/ DOS MOMENTOS|Antes de la revisión|Propuesta revisada/);
    assert.doesNotMatch(html, /id="method-title"|id="perfil"/);
    assert.equal([...html.matchAll(/<h1(?:\s|>)/g)].length, 1);
    assert.equal([...html.matchAll(/<dialog(?:\s|>)/g)].length, caseAreas.length);
    assert.doesNotMatch(html, /<dialog[^>]* open(?:=|\s|>)/, "El HTML inicial no abre diálogos no modales");
    for (const entry of snapshot.entries) {
      if (entry.kind === "service") {
        const section = html.slice(html.indexOf('id="servicios"'), html.indexOf('id="proyectos"'));
        for (const offer of entry.decisions) assert.ok(section.includes(offer), "Oferta visible en portada sin interacción");
        assert.doesNotMatch(section, /<a\b|<button\b|<dialog\b|<details\b/, "Los servicios se leen directamente, sin controles de apertura");
        assert.ok(section.includes(`id="resumen-servicio-${entry.slug}"`));
        continue;
      }
      assert.ok(!html.includes(`href="${entryPath(entry)}"`));
    }
    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map(match => match[1]!);
    assert.equal(new Set(ids).size, ids.length, "Sin IDs repetidos entre detalles y galerías");
    assert.match(html, /class="button" href="https:\/\/github.com\/AndMad404" target="_blank" rel="noopener noreferrer"/);
    assert.match(html, /class="text-link" href="https:\/\/www.linkedin.com\/in\/andres-mad\/" target="_blank" rel="noopener noreferrer"/);
    assert.match(html, /<button[^>]*id="resumen-area-sitios-web"[^>]*aria-haspopup="dialog"/);
    assert.doesNotMatch(html, /Leer caso completo/);
  } finally { router.dispose(); }
});

test("tarjeta con modal conserva enlace alternativo, título y control de cierre", async () => {
  const snapshot = snapshotSchema.parse(JSON.parse(await readFile("content/published.json", "utf8")));
  const entry = snapshot.entries.find(entry => entry.id === "fak")!;
  const router = createMemoryRouter([{ path: "/", element: createElement(ProjectCard, {
    entry, number: 1, expanded: true,
  }) }], { initialEntries: ["/?area=React#caso-fak"] });
  try {
    const html = renderToStaticMarkup(createElement(RouterProvider, { router }));
    assert.match(html, /<dialog[^>]*id="modal-fak"[^>]*aria-labelledby="modal-title-fak"/);
    assert.match(html, /<a[^>]*id="resumen-fak"[^>]*aria-controls="modal-fak"/);
    assert.ok(html.includes(`href="${entryPath(entry)}"`));
    assert.match(html, /aria-label="Volver a los casos"/);
    assert.match(html, /class="entry-modal-scroll" tabindex="0"/);
    assert.doesNotMatch(html, /<h1(?:\s|>)/);
    assert.ok(html.includes(entry.results));
    assert.doesNotMatch(html, /case-pointer|case-magnified|folder-lens-layer/);
  } finally { router.dispose(); }
});

test("ventanas recortan el papel en las coordenadas del fondo sin tocar el contenido", () => {
  const paper = { x: 100, y: -200, width: 1000, height: 2000 };
  const first = { x: 150, y: 80, width: 400, height: 300 };
  const second = { x: 150, y: 480, width: 400, height: 300 };
  assert.equal(paperWindowPath(paper, [first, second]),
    "M100 -200h1000v2000h-1000Z M150 80h400v300h-400Z M150 480h400v300h-400Z");
  assert.ok(!paperWindowPath(paper, [{ ...first, width: 0 }]).includes("M150"));
  assert.ok(!paperWindowPath(paper, [{ ...first, x: Number.NaN }]).includes("NaN"));
  assert.equal(paperWindowPath({ x: 20, y: 0, width: 350, height: 800 }, [
    { x: 300, y: 80, width: 160, height: 250 },
  ]), "M20 0h350v800h-350Z M300 80h70v250h-70Z", "La ventana móvil no abre un segundo hueco fuera del papel");
});

test("scroll por bloques conserva lectura completa, regreso y límites", () => {
  const blocks = [{ top: 100, height: 600 }, { top: 900, height: 1400 }, { top: 2500, height: 600 }];
  assert.equal(nextBlockScroll(blocks, 0, 900, 100, 1, 2400), 788, "Entra al inicio del bloque alto");
  assert.equal(nextBlockScroll(blocks, 788, 900, 100, 1, 2400), 1416, "No salta contenido alto hacia abajo");
  assert.equal(nextBlockScroll(blocks, 1100, 900, 100, -1, 2400), 788, "No salta contenido alto hacia arriba");
  assert.equal(nextBlockScroll(blocks, 1416, 900, 100, 1, 2400), 2294, "Continúa tras leer el final");
  assert.equal(nextBlockScroll(blocks, 2294, 900, 100, -1, 2400), 1416, "Regresa al final del bloque alto");
  assert.equal(nextBlockScroll(blocks, 788, 900, 100, -1, 2400), 0, "Vuelve al primer bloque sin posición negativa");
  assert.equal(nextBlockScroll(blocks, 2400, 900, 100, 1, 2400), null, "Libera el scroll al final");
  assert.equal(nextBlockScroll([], 0, 900, 100, 1, 0), null);
});

test("menú sigue la sección visible, excluye la cabecera y libera portada/método", () => {
  const select = visibleNavigationSection;
  assert.equal(select([{ id: "servicios", top: -500, bottom: 110 }, { id: "proyectos", top: 130, bottom: 1400 }], 120, 900), "proyectos");
  assert.equal(select([{ id: "perfil", top: -300, bottom: 250 }, { id: "contacto", top: 280, bottom: 850 }], 100, 900), "contacto");
  assert.equal(select([{ id: "servicios", top: 100, bottom: 850 }, { id: "proyectos", top: 900, bottom: 1800 }], 100, 900), "servicios");
  assert.equal(select([{ id: "", top: 100, bottom: 800 }, { id: "servicios", top: 850, bottom: 1600 }], 100, 900), "");
  assert.equal(select([{ id: "proyectos", top: -800, bottom: 90 }], 100, 900), "");
  assert.equal(select([], 100, 900), "");
});

test("contacto se activa al final aunque el footer sea menor que perfil", () => {
  const sections = [{ id: "perfil", top: -100, bottom: 800 }, { id: "contacto", top: 820, bottom: 880 }];
  assert.equal(visibleNavigationSection(sections, 100, 900, { scroll: 2100, height: 3000 }), "contacto");
  assert.equal(visibleNavigationSection(sections, 100, 900, { scroll: 2098.5, height: 3000 }), "contacto", "Tolera redondeo subpíxel");
  assert.equal(visibleNavigationSection(sections, 100, 900, { scroll: 2000, height: 3000 }), "perfil", "Salir del final restaura la sección visible");
  assert.equal(visibleNavigationSection([{ id: "perfil", top: -400, bottom: 150 }, { id: "contacto", top: 160, bottom: 800 }], 100, 900,
    { scroll: 1800, height: 3000 }), "perfil", "Contacto espera el final, aunque ya sea visible");
});

test("parallax no recorta una sección con ventanas ajenas u ocultas", () => {
  const paper = { x: 0, y: 100, width: 500, height: 600 };
  const overlap = { x: 20, y: 110, width: 200, height: 300 };
  assert.equal(ownedWindowPaths(paper, [{ bounds: overlap, owned: false }]), "", "Un recorte ajeno sobre el texto no atraviesa esta sección");
  assert.equal(ownedWindowPaths(paper, [{ bounds: { ...overlap, height: 0 }, owned: true }]), "");
  assert.equal(ownedWindowPaths(paper, [{ bounds: overlap, owned: true }]), paperWindowPath(overlap, []));
  assert.equal(ownedWindowPaths(paper, [{ bounds: { ...overlap, y: 750 }, owned: true }]), "", "La ventana propia tampoco atraviesa fuera de su sección");
});
