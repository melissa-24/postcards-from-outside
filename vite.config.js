import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Expose the dev server on the LAN so it can be opened on a phone.
  server: { host: true },
});
