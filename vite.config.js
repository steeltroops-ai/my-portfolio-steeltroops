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
      clientPort: 5173,
    },
    watch: {
      usePolling: false,
      interval: 100,
    },
  },
  build: {
    target: "es2020",
    minify: "esbuild",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          query: ["@tanstack/react-query"],
          neon: ["@neondatabase/serverless"],
          markdown: [
            "react-markdown",
            "remark-gfm",
            "rehype-highlight",
            "rehype-raw",
            "highlight.js",
          ],
          editor: ["react-quill", "quill"],
          motion: ["framer-motion"],
          icons: ["react-icons"],
          utils: ["dompurify", "prop-types"],
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
