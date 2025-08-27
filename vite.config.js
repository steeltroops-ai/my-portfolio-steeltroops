import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    // Critical CSS will be handled by a custom plugin
    {
      name: "critical-css",
      generateBundle(options, bundle) {
        // Extract critical CSS during build
        const cssFiles = Object.keys(bundle).filter((fileName) =>
          fileName.endsWith(".css")
        );

        cssFiles.forEach((fileName) => {
          const cssAsset = bundle[fileName];
          if (
            cssAsset.type === "asset" &&
            typeof cssAsset.source === "string"
          ) {
            // Identify critical CSS patterns (above-the-fold styles)
            const criticalPatterns = [
              // Layout and typography
              /\.container[^{]*{[^}]*}/g,
              /\.max-w-[^{]*{[^}]*}/g,
              /\.mx-auto[^{]*{[^}]*}/g,
              /\.px-[^{]*{[^}]*}/g,
              /\.py-[^{]*{[^}]*}/g,
              // Hero section styles
              /\.hero[^{]*{[^}]*}/g,
              /\.text-[^{]*{[^}]*}/g,
              /\.font-[^{]*{[^}]*}/g,
              // Navigation styles
              /\.nav[^{]*{[^}]*}/g,
              /\.fixed[^{]*{[^}]*}/g,
              /\.top-[^{]*{[^}]*}/g,
              /\.z-[^{]*{[^}]*}/g,
              // Background and colors
              /\.bg-[^{]*{[^}]*}/g,
              /\.text-neutral[^{]*{[^}]*}/g,
              /\.text-cyan[^{]*{[^}]*}/g,
            ];

            let criticalCSS = "";
            criticalPatterns.forEach((pattern) => {
              const matches = cssAsset.source.match(pattern);
              if (matches) {
                criticalCSS += matches.join("\n");
              }
            });

            // Create a separate critical CSS file
            if (criticalCSS) {
              this.emitFile({
                type: "asset",
                fileName: "critical.css",
                source: criticalCSS,
              });
            }
          }
        });
      },
    },
    // Bundle analyzer for production builds
    process.env.ANALYZE &&
      visualizer({
        filename: "dist/bundle-analysis.html",
        open: true,
        gzipSize: true,
        brotliSize: true,
        template: "treemap", // 'treemap', 'sunburst', 'network'
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          query: ["@tanstack/react-query"],
          supabase: ["@supabase/supabase-js"],
          markdown: [
            "react-markdown",
            "remark-gfm",
            "rehype-highlight",
            "rehype-raw",
          ],
          editor: ["react-quill"],
          motion: ["framer-motion"],
          icons: ["react-icons"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
