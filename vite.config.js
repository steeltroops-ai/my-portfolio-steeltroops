import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          query: ['@tanstack/react-query'],
          supabase: ['@supabase/supabase-js'],
          markdown: ['react-markdown', 'remark-gfm', 'rehype-highlight', 'rehype-raw'],
          editor: ['react-quill'],
          motion: ['framer-motion'],
          icons: ['react-icons'],
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})