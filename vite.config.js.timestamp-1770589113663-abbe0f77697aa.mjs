// vite.config.js
import { defineConfig } from "file:///C:/Omniverse/Programming/my-portfolio-steeltroops/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Omniverse/Programming/my-portfolio-steeltroops/node_modules/@vitejs/plugin-react/dist/index.js";
import { resolve } from "path";
var __vite_injected_original_dirname = "C:\\Omniverse\\Programming\\my-portfolio-steeltroops";
var vite_config_default = defineConfig({
  plugins: [
    react({
      jsxRuntime: "automatic"
    })
  ],
  define: {
    global: "globalThis"
  },
  envDir: ".",
  envPrefix: "VITE_",
  resolve: {
    alias: {
      "@": resolve(__vite_injected_original_dirname, "./src"),
      "@/components": resolve(__vite_injected_original_dirname, "./src/components"),
      "@/services": resolve(__vite_injected_original_dirname, "./src/services"),
      "@/utils": resolve(__vite_injected_original_dirname, "./src/utils"),
      "@/hooks": resolve(__vite_injected_original_dirname, "./src/hooks"),
      "@/lib": resolve(__vite_injected_original_dirname, "./src/lib"),
      "@/data": resolve(__vite_injected_original_dirname, "./src/data"),
      "@/constants": resolve(__vite_injected_original_dirname, "./src/constants")
    }
  },
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    open: false,
    cors: true,
    hmr: {
      overlay: true,
      clientPort: 5173
    },
    watch: {
      usePolling: false,
      interval: 100
    },
    // Proxy API requests to local Express server
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false
      }
    }
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
          markdown: [
            "react-markdown",
            "remark-gfm",
            "rehype-highlight",
            "rehype-raw",
            "highlight.js"
          ],
          editor: ["react-quill", "quill"],
          motion: ["framer-motion"],
          icons: ["react-icons"],
          utils: ["dompurify", "prop-types"]
        },
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]"
      }
    },
    chunkSizeWarningLimit: 1e3,
    reportCompressedSize: true
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query"
    ]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxPbW5pdmVyc2VcXFxcUHJvZ3JhbW1pbmdcXFxcbXktcG9ydGZvbGlvLXN0ZWVsdHJvb3BzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxPbW5pdmVyc2VcXFxcUHJvZ3JhbW1pbmdcXFxcbXktcG9ydGZvbGlvLXN0ZWVsdHJvb3BzXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9PbW5pdmVyc2UvUHJvZ3JhbW1pbmcvbXktcG9ydGZvbGlvLXN0ZWVsdHJvb3BzL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xyXG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSBcInBhdGhcIjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgcGx1Z2luczogW1xyXG4gICAgcmVhY3Qoe1xyXG4gICAgICBqc3hSdW50aW1lOiBcImF1dG9tYXRpY1wiLFxyXG4gICAgfSksXHJcbiAgXSxcclxuICBkZWZpbmU6IHtcclxuICAgIGdsb2JhbDogXCJnbG9iYWxUaGlzXCIsXHJcbiAgfSxcclxuICBlbnZEaXI6IFwiLlwiLFxyXG4gIGVudlByZWZpeDogXCJWSVRFX1wiLFxyXG4gIHJlc29sdmU6IHtcclxuICAgIGFsaWFzOiB7XHJcbiAgICAgIFwiQFwiOiByZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuICAgICAgXCJAL2NvbXBvbmVudHNcIjogcmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmMvY29tcG9uZW50c1wiKSxcclxuICAgICAgXCJAL3NlcnZpY2VzXCI6IHJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjL3NlcnZpY2VzXCIpLFxyXG4gICAgICBcIkAvdXRpbHNcIjogcmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmMvdXRpbHNcIiksXHJcbiAgICAgIFwiQC9ob29rc1wiOiByZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyYy9ob29rc1wiKSxcclxuICAgICAgXCJAL2xpYlwiOiByZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyYy9saWJcIiksXHJcbiAgICAgIFwiQC9kYXRhXCI6IHJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjL2RhdGFcIiksXHJcbiAgICAgIFwiQC9jb25zdGFudHNcIjogcmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmMvY29uc3RhbnRzXCIpLFxyXG4gICAgfSxcclxuICB9LFxyXG4gIHNlcnZlcjoge1xyXG4gICAgaG9zdDogdHJ1ZSxcclxuICAgIHBvcnQ6IDUxNzMsXHJcbiAgICBzdHJpY3RQb3J0OiBmYWxzZSxcclxuICAgIG9wZW46IGZhbHNlLFxyXG4gICAgY29yczogdHJ1ZSxcclxuICAgIGhtcjoge1xyXG4gICAgICBvdmVybGF5OiB0cnVlLFxyXG4gICAgICBjbGllbnRQb3J0OiA1MTczLFxyXG4gICAgfSxcclxuICAgIHdhdGNoOiB7XHJcbiAgICAgIHVzZVBvbGxpbmc6IGZhbHNlLFxyXG4gICAgICBpbnRlcnZhbDogMTAwLFxyXG4gICAgfSxcclxuICAgIC8vIFByb3h5IEFQSSByZXF1ZXN0cyB0byBsb2NhbCBFeHByZXNzIHNlcnZlclxyXG4gICAgcHJveHk6IHtcclxuICAgICAgXCIvYXBpXCI6IHtcclxuICAgICAgICB0YXJnZXQ6IFwiaHR0cDovL2xvY2FsaG9zdDozMDAxXCIsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgYnVpbGQ6IHtcclxuICAgIHRhcmdldDogXCJlczIwMjBcIixcclxuICAgIG1pbmlmeTogXCJlc2J1aWxkXCIsXHJcbiAgICBzb3VyY2VtYXA6IGZhbHNlLFxyXG4gICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICBvdXRwdXQ6IHtcclxuICAgICAgICBtYW51YWxDaHVua3M6IHtcclxuICAgICAgICAgIHZlbmRvcjogW1wicmVhY3RcIiwgXCJyZWFjdC1kb21cIl0sXHJcbiAgICAgICAgICByb3V0ZXI6IFtcInJlYWN0LXJvdXRlci1kb21cIl0sXHJcbiAgICAgICAgICBxdWVyeTogW1wiQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5XCJdLFxyXG5cclxuICAgICAgICAgIG1hcmtkb3duOiBbXHJcbiAgICAgICAgICAgIFwicmVhY3QtbWFya2Rvd25cIixcclxuICAgICAgICAgICAgXCJyZW1hcmstZ2ZtXCIsXHJcbiAgICAgICAgICAgIFwicmVoeXBlLWhpZ2hsaWdodFwiLFxyXG4gICAgICAgICAgICBcInJlaHlwZS1yYXdcIixcclxuICAgICAgICAgICAgXCJoaWdobGlnaHQuanNcIixcclxuICAgICAgICAgIF0sXHJcbiAgICAgICAgICBlZGl0b3I6IFtcInJlYWN0LXF1aWxsXCIsIFwicXVpbGxcIl0sXHJcbiAgICAgICAgICBtb3Rpb246IFtcImZyYW1lci1tb3Rpb25cIl0sXHJcbiAgICAgICAgICBpY29uczogW1wicmVhY3QtaWNvbnNcIl0sXHJcbiAgICAgICAgICB1dGlsczogW1wiZG9tcHVyaWZ5XCIsIFwicHJvcC10eXBlc1wiXSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIGNodW5rRmlsZU5hbWVzOiBcImFzc2V0cy9bbmFtZV0tW2hhc2hdLmpzXCIsXHJcbiAgICAgICAgZW50cnlGaWxlTmFtZXM6IFwiYXNzZXRzL1tuYW1lXS1baGFzaF0uanNcIixcclxuICAgICAgICBhc3NldEZpbGVOYW1lczogXCJhc3NldHMvW25hbWVdLVtoYXNoXS5bZXh0XVwiLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTAwMCxcclxuICAgIHJlcG9ydENvbXByZXNzZWRTaXplOiB0cnVlLFxyXG4gIH0sXHJcbiAgb3B0aW1pemVEZXBzOiB7XHJcbiAgICBpbmNsdWRlOiBbXHJcbiAgICAgIFwicmVhY3RcIixcclxuICAgICAgXCJyZWFjdC1kb21cIixcclxuICAgICAgXCJyZWFjdC1yb3V0ZXItZG9tXCIsXHJcbiAgICAgIFwiQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5XCIsXHJcbiAgICBdLFxyXG4gIH0sXHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTZVLFNBQVMsb0JBQW9CO0FBQzFXLE9BQU8sV0FBVztBQUNsQixTQUFTLGVBQWU7QUFGeEIsSUFBTSxtQ0FBbUM7QUFJekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLE1BQ0osWUFBWTtBQUFBLElBQ2QsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLFFBQVE7QUFBQSxFQUNWO0FBQUEsRUFDQSxRQUFRO0FBQUEsRUFDUixXQUFXO0FBQUEsRUFDWCxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLE1BQy9CLGdCQUFnQixRQUFRLGtDQUFXLGtCQUFrQjtBQUFBLE1BQ3JELGNBQWMsUUFBUSxrQ0FBVyxnQkFBZ0I7QUFBQSxNQUNqRCxXQUFXLFFBQVEsa0NBQVcsYUFBYTtBQUFBLE1BQzNDLFdBQVcsUUFBUSxrQ0FBVyxhQUFhO0FBQUEsTUFDM0MsU0FBUyxRQUFRLGtDQUFXLFdBQVc7QUFBQSxNQUN2QyxVQUFVLFFBQVEsa0NBQVcsWUFBWTtBQUFBLE1BQ3pDLGVBQWUsUUFBUSxrQ0FBVyxpQkFBaUI7QUFBQSxJQUNyRDtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLFlBQVk7QUFBQSxJQUNaLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLEtBQUs7QUFBQSxNQUNILFNBQVM7QUFBQSxNQUNULFlBQVk7QUFBQSxJQUNkO0FBQUEsSUFDQSxPQUFPO0FBQUEsTUFDTCxZQUFZO0FBQUEsTUFDWixVQUFVO0FBQUEsSUFDWjtBQUFBO0FBQUEsSUFFQSxPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxRQUFRO0FBQUEsTUFDVjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixRQUFRO0FBQUEsSUFDUixXQUFXO0FBQUEsSUFDWCxlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUEsVUFDWixRQUFRLENBQUMsU0FBUyxXQUFXO0FBQUEsVUFDN0IsUUFBUSxDQUFDLGtCQUFrQjtBQUFBLFVBQzNCLE9BQU8sQ0FBQyx1QkFBdUI7QUFBQSxVQUUvQixVQUFVO0FBQUEsWUFDUjtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQUEsVUFDQSxRQUFRLENBQUMsZUFBZSxPQUFPO0FBQUEsVUFDL0IsUUFBUSxDQUFDLGVBQWU7QUFBQSxVQUN4QixPQUFPLENBQUMsYUFBYTtBQUFBLFVBQ3JCLE9BQU8sQ0FBQyxhQUFhLFlBQVk7QUFBQSxRQUNuQztBQUFBLFFBQ0EsZ0JBQWdCO0FBQUEsUUFDaEIsZ0JBQWdCO0FBQUEsUUFDaEIsZ0JBQWdCO0FBQUEsTUFDbEI7QUFBQSxJQUNGO0FBQUEsSUFDQSx1QkFBdUI7QUFBQSxJQUN2QixzQkFBc0I7QUFBQSxFQUN4QjtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1osU0FBUztBQUFBLE1BQ1A7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
