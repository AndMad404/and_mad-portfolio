import type { Config } from "@react-router/dev/config";
import { readFileSync } from "node:fs";
import { snapshotSchema, entryPath } from "./shared/contracts";
const snapshot = snapshotSchema.parse(
  JSON.parse(readFileSync("content/published.json", "utf8")),
);
export default {
  buildDirectory: "build/site",
  ssr: false,
  // RR 7 normalizes request paths before matching the prerender allowlist.
  // Public links retain their historical trailing slash.
  prerender: [
    "/",
    ...snapshot.entries.map((e) => entryPath(e).replace(/\/$/, "")),
  ],
} satisfies Config;
