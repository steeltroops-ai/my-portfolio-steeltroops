import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: "automatic",
    }),
  ],
  define: {
    global: "globalThis",
  },
  envDir: ".",
  envPrefix: "VITE_",
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@/components": resolve(__dirname, "./src/components"),
      "@/services": resolve(__dirname, "./src/services"),
      "@/utils": resolve(__dirname, "./src/utils"),
      "@/hooks": resolve(__dirname, "./src/hooks"),
      "@/lib": resolve(__dirname, "./src/lib"),
      "@/data": resolve(__dirname, "./src/data"),
      "@/constants": resolve(__dirname, "./src/constants"),
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    open: false,
    cors: true,
    hmr: {
      overlay: true,
    },
    watch: {
      usePolling: false,
      interval: 100,
    },
    // Proxy API requests to local Express server
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    target: "es2020",
    minify: "esbuild",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("scheduler")
            ) {
              return "vendor";
            }
            if (id.includes("framer-motion") || id.includes("popmotion")) {
              return "motion";
            }
            if (id.includes("ua-parser-js")) {
              return "forensics";
            }
            if (id.includes("react-router") || id.includes("@remix-run")) {
              return "router";
            }
            if (id.includes("@tanstack")) {
              return "query";
            }
            if (id.includes("react-icons")) {
              return "icons";
            }
            if (
              id.includes("highlight.js") ||
              id.includes("rehype") ||
              id.includes("remark") ||
              id.includes("micromark") ||
              id.includes("unified")
            ) {
              return "blog-libs";
            }
            if (id.includes("quill")) {
              return "editor-libs";
            }
            if (id.includes("dompurify") || id.includes("prop-types")) {
              return "utils";
            }
            return "shared-vendor";
          }
          // Internal chunking for features to keep index lean
          if (id.includes("src/features/portfolio")) return "portfolio-feature";
          if (id.includes("src/features/blog")) return "blog-feature";
          if (id.includes("src/features/admin")) return "admin-feature";
          if (id.includes("src/shared/components")) return "shared-components";
        },
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: true,
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
    ],
  },
});
