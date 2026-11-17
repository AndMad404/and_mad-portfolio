import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

/** Resolve the real public CSS cascade so modularization cannot hide regressions. */
export async function readPublicStyles(file = "app/public.css", ancestors = new Set<string>()): Promise<string> {
  const { default: postcss } = await import("postcss");
  const absolute = path.resolve(file);
  const relative = path.relative(path.resolve("app"), absolute);
  assert.ok(relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative), "CSS stays within app");
  assert.ok(!ancestors.has(absolute), "No cyclic CSS imports");
  const next = new Set(ancestors).add(absolute);
  const sheet = postcss.parse(await readFile(absolute, "utf8"), { from: absolute });
  for (const node of [...sheet.nodes]) {
    if (node.type !== "atrule" || node.name !== "import") continue;
    const imported = node.params.match(/^["'](\.[^"']+\.css)["']$/)?.[1];
    assert.ok(imported, "Only local CSS imports are supported by the regression guard");
    node.replaceWith(postcss.parse(await readPublicStyles(path.resolve(path.dirname(absolute), imported), next)).nodes);
  }
  return sheet.toString();
}
