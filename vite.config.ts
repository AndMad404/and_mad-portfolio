import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
const origin = process.env.SITE_ORIGIN || "";
if (
  origin &&
  (new URL(origin).origin !== origin || !origin.startsWith("https://"))
)
  throw new Error("SITE_ORIGIN debe ser un origen HTTPS");
if (process.env.INDEXABLE === "true" && !origin)
  throw new Error("SITE_ORIGIN requerido para indexar");
export default defineConfig({
  cacheDir: "node_modules/.vite-public",
  resolve: { dedupe: ["react", "react-dom"] },
  optimizeDeps: {
    include: [
      "react",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-router",
      "react-router/dom",
      "zod",
    ],
  },
  plugins: [tailwindcss(), reactRouter()],
  define: {
    "import.meta.env.VITE_SITE_ORIGIN": JSON.stringify(origin),
    "import.meta.env.VITE_INDEXABLE": JSON.stringify(
      process.env.INDEXABLE || "false",
    ),
  },
});
