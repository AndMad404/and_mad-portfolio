// EDICIÓN — NO VERIFICADO PARA ENTREGA. Fuera de npm test, verify y CI.
// Los resultados locales históricos no acreditan el circuito editorial real.
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement, Fragment } from "react";
import { readFile } from "node:fs/promises";
import { snapshotSchema } from "../../shared/contracts";
import { EntryView } from "../../shared/EntryView";

test("varias vistas previas conservan referencias únicas sin depender del router ni del navegador", async () => {
  const snapshot = snapshotSchema.parse(
    JSON.parse(await readFile("content/published.json", "utf8")),
  );
  const entry = {
    ...snapshot.entries[0]!,
    evidence: [
      { id: "first", label: "Referencia <privada> revisada" },
      {
        id: "second",
        label: "Referencia publicada",
        url: "https://example.com/evidence",
      },
    ],
  };
  const html = renderToStaticMarkup(
    createElement(
      Fragment,
      null,
      createElement(EntryView, { entry }),
      createElement(EntryView, { entry: { ...entry, id: "another-case" } }),
    ),
  );
  const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((match) => match[1]!);
  assert.equal(
    new Set(ids).size,
    ids.length,
    "Las galerías no duplican IDs en el panel",
  );
  for (const control of html.matchAll(/aria-controls="([^"]+)"/g))
    assert.ok(ids.includes(control[1]!));
  assert.match(html, /Referencia &lt;privada&gt; revisada/);
  assert.doesNotMatch(html, /<privada>/);
  assert.doesNotMatch(
    html,
    /view-transition-name:case-/,
    "Las vistas previas no registran transiciones públicas",
  );
  assert.equal(
    [...html.matchAll(/href="https:\/\/example.com\/evidence"/g)].length,
    2,
  );
});
