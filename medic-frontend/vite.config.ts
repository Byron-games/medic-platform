import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // ── Health checks (proxied through Vite to avoid CORS) ──
      "/health/gateway": {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: (_path) => "/actuator/health",
      },
      "/health/auth": {
        target: "http://localhost:8087",
        changeOrigin: true,
        rewrite: (_path) => "/actuator/health",
      },
      "/health/patient": {
        target: "http://localhost:8081",
        changeOrigin: true,
        rewrite: (_path) => "/actuator/health",
      },
      "/health/emr": {
        target: "http://localhost:8082",
        changeOrigin: true,
        rewrite: (_path) => "/actuator/health",
      },
      "/health/appointment": {
        target: "http://localhost:8083",
        changeOrigin: true,
        rewrite: (_path) => "/actuator/health",
      },
      "/health/telemedicine": {
        target: "http://localhost:8084",
        changeOrigin: true,
        rewrite: (_path) => "/actuator/health",
      },
      "/health/pharmacy": {
        target: "http://localhost:8085",
        changeOrigin: true,
        rewrite: (_path) => "/actuator/health",
      },
      "/health/analytics": {
        target: "http://localhost:8086",
        changeOrigin: true,
        rewrite: (_path) => "/actuator/health",
      },
      "/health/notification": {
        target: "http://localhost:8088",
        changeOrigin: true,
        rewrite: (_path) => "/actuator/health",
      },
      "/health/ussd": {
        target: "http://localhost:8089",
        changeOrigin: true,
        rewrite: (_path) => "/actuator/health",
      },

      // ── Service API routes ──────────────────────────────────
      "/api/v1/auth": { target: "http://localhost:8087", changeOrigin: true },
      "/api/v1/patients": {
        target: "http://localhost:8081",
        changeOrigin: true,
      },
      "/api/v1/emr": { target: "http://localhost:8082", changeOrigin: true },
      "/api/v1/appointments": {
        target: "http://localhost:8083",
        changeOrigin: true,
      },
      "/api/v1/telemedicine": {
        target: "http://localhost:8084",
        changeOrigin: true,
      },
      "/api/v1/pharmacy": {
        target: "http://localhost:8085",
        changeOrigin: true,
      },
      "/api/v1/analytics": {
        target: "http://localhost:8086",
        changeOrigin: true,
      },
      "/api/v1/notifications": {
        target: "http://localhost:8088",
        changeOrigin: true,
      },
      "/api/v1/ussd": { target: "http://localhost:8089", changeOrigin: true },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          charts: ["recharts"],
        },
      },
    },
  },
});
