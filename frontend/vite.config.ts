/**
 * Vite Configuration - Phase 1
 * Konfigurasi build tool Vite untuk React + TypeScript.
 * Termasuk proxy API ke API Gateway untuk development.
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    open: true,
    allowedHosts: [
      "localhost",
      ".trycloudflare.com",   // Izinkan semua subdomain Cloudflare Tunnel
    ],
    proxy: {
      // Proxy semua request /api ke API Gateway (langsung, tanpa BFF)
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
      // Proxy WebSocket jika diperlukan di Phase 2+
      "/ws": {
        target: "ws://localhost:8000",
        ws: true,
      },
    },
  },

  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
