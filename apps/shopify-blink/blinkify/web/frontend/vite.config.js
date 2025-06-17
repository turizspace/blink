import { defineConfig } from "vite";
import { dirname } from "path";
import { fileURLToPath } from "url";
import react from "@vitejs/plugin-react";

if (!process.env.SHOPIFY_API_KEY) {
  throw new Error("SHOPIFY_API_KEY environment variable is required");
}

const proxyOptions = {
  target: `http://127.0.0.1:${process.env.BACKEND_PORT}`,
  changeOrigin: true,
  secure: true,
  ws: false,
};

export default defineConfig({
  root: dirname(fileURLToPath(import.meta.url)),
  plugins: [react()],
  define: {
    "process.env.SHOPIFY_API_KEY": JSON.stringify(process.env.SHOPIFY_API_KEY),
  },
  esbuild: {
    jsxInject: `import React from 'react'`,
  },
  server: {
    port: process.env.FRONTEND_PORT,
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 64999,
      clientPort: 64999,
    },
    proxy: {
      "^/(\\?.*)?$": proxyOptions,
      "^/api(/|(\\?.*)?$)": proxyOptions,
    },
  },
});
