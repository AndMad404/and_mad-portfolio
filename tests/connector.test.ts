import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  configSchema,
  resolveResource,
  readResource,
} from "../connector/reader";
test("configuración no admite HTTP, rutas del navegador ni traversal", () => {
  assert.equal(
    configSchema.safeParse({
      endpoint: "http://example.com",
      prometheusRoot: ".",
      resources: {},
    }).success,
    false,
  );
  assert.equal(
    configSchema.safeParse({
      endpoint: "https://example.com",
      prometheusRoot: ".",
      resources: { bad: "../outside" },
    }).success,
    false,
  );
});
test("conector limita lectura a archivos resueltos de su lista y oculta errores", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "portfolio-reader-"));
  try {
    await mkdir(path.join(root, "docs"));
    await writeFile(path.join(root, "docs", "guide.md"), "local test");
    const config = configSchema.parse({
      endpoint: "https://panel.example.com",
      prometheusRoot: root,
      resources: { guide: "docs/guide.md", directory: "docs" },
    });
    assert.equal(
      (await resolveResource(config, "guide")).file,
      "docs/guide.md",
    );
    await assert.rejects(resolveResource(config, "not-allowed"), /DENIED/);
    await assert.rejects(resolveResource(config, "directory"), /DENIED/);
    const result = await readResource(config, {
      operation: "read",
      resourceId: "guide",
    });
    assert.equal(result.ok, false);
    assert.doesNotMatch(
      result.text,
      new RegExp(root.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
