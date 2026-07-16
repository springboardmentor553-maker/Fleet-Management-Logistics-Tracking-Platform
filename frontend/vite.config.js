import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/login": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/register": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/profile": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/admin": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/dashboard": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/drivers": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/vehicles": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/shipments": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
