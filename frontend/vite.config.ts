/**
 * Vite Configuration - Phase 1
 * Konfigurasi build tool Vite untuk React + TypeScript.
 * Termasuk proxy API ke BFF Layer untuk development.
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    open: true,
    proxy: {
      // Proxy semua request /api ke BFF Layer
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
      // Proxy WebSocket jika diperlukan di Phase 2+
      "/ws": {
        target: "ws://localhost:3000",
        ws: true,
      },
    },
  },

  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
