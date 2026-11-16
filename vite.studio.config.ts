import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  root: "studio",
  publicDir: "../public",
  plugins: [tailwindcss()],
  build: { outDir: "../build/studio", emptyOutDir: true },
  server: {
    port: 5174,
    strictPort: true,
    proxy: { "/api": "http://127.0.0.1:8787" },
  },
});
