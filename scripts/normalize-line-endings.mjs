import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = realpathSync(new URL("..", import.meta.url));

function normalizeLineEndings() {
  if (!existsSync(path.join(root, ".git"))) {
    console.log("Normalización omitida: esta copia no contiene metadatos de Git.");
    return;
  }

  const entries = execFileSync("git", ["-C", root, "ls-files", "--eol", "-z"], { encoding: "utf8" });
  let normalized = 0;
  for (const entry of new Set(entries.split("\0"))) {
    const separator = entry.indexOf("\t");
    if (separator < 0) continue;
    const status = entry.slice(0, separator);
    if (!/\bw\/(?:crlf|mixed)\s/.test(status) ||
        !/\battr\/(?:text(?:=auto)?\s+)?eol=lf\s*$/.test(status)) continue;

    const target = path.resolve(root, entry.slice(separator + 1));
    const relative = path.relative(root, target);
    if (relative.startsWith(".." + path.sep) || relative === ".." || path.isAbsolute(relative)) continue;
    const stat = lstatSync(target, { throwIfNoEntry: false });
    if (!stat?.isFile() || stat.nlink !== 1 || realpathSync(target) !== target) continue;

    // Latin-1 round-trips the original bytes, including non-ASCII text.
    const before = readFileSync(target).toString("latin1");
    const after = before.replace(/\r\n/g, "\n");
    if (before === after) continue;
    writeFileSync(target, after, "latin1");
    normalized++;
  }
  console.log(`Finales LF normalizados en ${normalized} archivo(s).`);
}

normalizeLineEndings();
