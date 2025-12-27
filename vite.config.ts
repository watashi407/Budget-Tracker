import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Increase warning limit to 500 KB (more reasonable threshold)
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Optimized code-splitting for better caching and smaller chunks
        manualChunks(id) {
          // Core React - rarely changes
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react'
          }
          // Router - separate chunk
          if (id.includes('@tanstack/react-router')) {
            return 'vendor-router'
          }
          // Query state management
          if (id.includes('@tanstack/react-query')) {
            return 'vendor-query'
          }
          // Supabase SDK
          if (id.includes('@supabase')) {
            return 'vendor-supabase'
          }
          // Charts library - only needed on dashboard
          if (id.includes('recharts') || id.includes('d3-')) {
            return 'vendor-charts'
          }
          // PDF/Excel export utilities - lazy loaded when needed
          if (id.includes('jspdf') || id.includes('html2canvas')) {
            return 'vendor-pdf'
          }
          if (id.includes('xlsx')) {
            return 'vendor-excel'
          }
          // UI components from Radix
          if (id.includes('@radix-ui')) {
            return 'vendor-ui'
          }
          // Form validation
          if (id.includes('zod') || id.includes('react-hook-form') || id.includes('@hookform')) {
            return 'vendor-forms'
          }
          // Date utilities
          if (id.includes('date-fns')) {
            return 'vendor-dates'
          }
          // DOMPurify for sanitization
          if (id.includes('dompurify') || id.includes('purify')) {
            return 'vendor-security'
          }
          // Markdown rendering
          if (id.includes('marked') || id.includes('markdown')) {
            return 'vendor-markdown'
          }
          // Class variance authority and utilities
          if (id.includes('class-variance-authority') || id.includes('clsx') || id.includes('tailwind-merge')) {
            return 'vendor-styling'
          }
          // Lucide icons
          if (id.includes('lucide')) {
            return 'vendor-icons'
          }
          // All other node_modules
          if (id.includes('node_modules')) {
            return 'vendor-misc'
          }
        },
      },
    },
    // Enable source maps for debugging in production (optional)
    sourcemap: false,
    // Minify aggressively
    minify: 'esbuild',
    target: 'esnext',
  },
})
