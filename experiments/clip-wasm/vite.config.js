// Standalone config for the CLIP wasm experiment (not part of the app build).
// Run: npx vite --config experiments/clip-wasm/vite.config.js
// COI=1 adds cross-origin isolation headers, which lets onnxruntime use multiple threads.
import { defineConfig } from "vite";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const isolated = process.env.COI === "1";

export default defineConfig({
  root: here,
  server: {
    host: true,
    port: isolated ? 5181 : 5180,
    headers: isolated
      ? { "Cross-Origin-Opener-Policy": "same-origin", "Cross-Origin-Embedder-Policy": "require-corp" }
      : {},
  },
  // Transformers.js ships its own wasm loader; don't let Vite pre-bundle it.
  optimizeDeps: { exclude: ["@huggingface/transformers"] },
  plugins: [
    {
      name: "save-results",
      configureServer(server) {
        server.middlewares.use("/__results", (req, res) => {
          let body = "";
          req.on("data", (c) => (body += c));
          req.on("end", () => {
            const mode = new URL(req.url, "http://x").searchParams.get("mode");
            writeFileSync(`${here}/results-${mode}.json`, body);
            res.end("ok");
          });
        });
      },
    },
  ],
});
