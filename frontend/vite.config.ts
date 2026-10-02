import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 43123,
    strictPort: true,
    allowedHosts: ["919c434d77ed925ad6dc-pod-4nbsq5d5rzezxldt7ayhzwufo4-43123.us7.cursorvm.com"],
  },
  preview: {
    host: "0.0.0.0",
    port: 43123,
    strictPort: true,
  },
});
