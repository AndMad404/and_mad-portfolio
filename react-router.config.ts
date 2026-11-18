import type { Config } from "@react-router/dev/config";
import { publicPaths } from "./app/content";
export default {
  buildDirectory: "build/site",
  ssr: false,
  // RR 7 normalizes request paths before matching the prerender allowlist.
  // Public links retain their historical trailing slash.
  prerender: publicPaths.map(path => path === "/" ? path : path.replace(/\/$/, "")),
} satisfies Config;
