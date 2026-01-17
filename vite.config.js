import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      // Use automatic JSX runtime (no need to import React)
      jsxRuntime: "automatic",
    }),
    // Add bundle analyzer when ANALYZE=true
    process.env.ANALYZE &&
      visualizer({
        filename: "dist/stats.html",
        open: true,
        gzipSize: true,
        brotliSize: true,
      }),
  ].filter(Boolean),
  // Bun compatibility fixes
  define: {
    global: "globalThis",
  },
  // Ensure environment variables are properly loaded
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
  // Optimized for Bun development server
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    open: false, // Don't auto-open browser
    cors: true,
    hmr: {
      overlay: true,
      // Disable WebSocket for Bun compatibility
      clientPort: 5173,
    },
    // Faster file watching
    watch: {
      usePolling: false,
      interval: 100,
    },
  },
  // Vitest configuration
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    css: true,
    reporters: ["verbose"],
  },
  // Optimized build configuration
  build: {
    target: "es2020",
    minify: "esbuild",
    sourcemap: process.env.NODE_ENV === "development" ? "inline" : false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          vendor: ["react", "react-dom"],
          // Routing
          router: ["react-router-dom"],
          // State management and queries
          query: ["@tanstack/react-query"],
          // Backend services
          neon: ["@neondatabase/serverless"],
          // Markdown processing (largest chunk)
          markdown: [
            "react-markdown",
            "remark-gfm",
            "rehype-highlight",
            "rehype-raw",
            "highlight.js",
            "prismjs",
          ],
          // Rich text editor
          editor: ["react-quill", "quill"],
          // Animations
          motion: ["framer-motion"],
          // Icons
          icons: ["react-icons"],
          // Utilities
          utils: ["dompurify", "prop-types"],
        },
        // Optimize chunk file names
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    chunkSizeWarningLimit: 1000,
    // Enable compression
    reportCompressedSize: true,
  },
  // Performance optimizations
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
    ],
  },
}));
