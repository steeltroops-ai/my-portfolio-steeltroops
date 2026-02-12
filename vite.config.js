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
    minify: "terser", // Better compression than esbuild
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info"], // Remove specific console methods
      },
    },
    sourcemap: false,
    cssCodeSplit: true, // Enable CSS code splitting
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // Core React bundle - most critical
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("scheduler")
            ) {
              return "vendor";
            }
            // Animation library - lazy loaded
            if (id.includes("framer-motion") || id.includes("popmotion")) {
              return "motion";
            }
            // Forensics - admin only
            if (id.includes("ua-parser-js")) {
              return "forensics";
            }
            // Router - critical but separate
            if (id.includes("react-router") || id.includes("@remix-run")) {
              return "router";
            }
            // Query library - critical
            if (id.includes("@tanstack")) {
              return "query";
            }
            // Icons - can be split per feature
            if (id.includes("react-icons")) {
              return "icons";
            }
            // Blog libraries - lazy loaded
            if (
              id.includes("highlight.js") ||
              id.includes("rehype") ||
              id.includes("remark") ||
              id.includes("micromark") ||
              id.includes("unified")
            ) {
              return "blog-libs";
            }
            // Editor - admin only
            if (id.includes("quill")) {
              return "editor-libs";
            }
            // Utilities
            if (id.includes("dompurify") || id.includes("prop-types")) {
              return "utils";
            }
            return "shared-vendor";
          }
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
      "framer-motion", // Pre-bundle for faster dev
    ],
    exclude: ["@vite/client", "@vite/env"],
  },
});
