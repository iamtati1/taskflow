import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const SERVER_PORT = 8080;

export default defineConfig({
  plugins: [react()],

  test: {
    setupFiles: ["./src/test/setup.js"],
  },

  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,

    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 5173,
    },

    proxy: {
      "/api": {
        target: `http://localhost:${SERVER_PORT}`,
        changeOrigin: true,

        // 🔥 IMPORTANT: ensures cookies/session headers behave correctly
        cookieDomainRewrite: "localhost",

        secure: false,

        // optional but helpful for debugging
        logLevel: "debug",
      },
    },
  },
});