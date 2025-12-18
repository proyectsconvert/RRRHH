import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimizaciones para producción
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Elimina console.log en producción
        drop_debugger: true, // Elimina debugger statements
        pure_funcs: ['console.log', 'console.info', 'console.debug'], // Elimina funciones específicas
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Separate Supabase client into its own chunk
          if (id.includes('supabase/client')) {
            return 'supabase-client';
          }
          // Separate PDF.js into its own chunk
          if (id.includes('pdfjs-dist')) {
            return 'pdfjs';
          }
          // Separate evolution-api utils
          if (id.includes('evolution-api')) {
            return 'evolution-api';
          }
          // Vendor chunk for React and core libraries
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor';
            }
            if (id.includes('@radix-ui')) {
              return 'ui';
            }
            if (id.includes('@supabase')) {
              return 'supabase';
            }
            return 'vendor-other';
          }
        },
      },
    },
    // Generar sourcemaps solo en desarrollo
    sourcemap: mode === 'development',
    // Optimizaciones adicionales
    cssCodeSplit: true,
    reportCompressedSize: false, // Desactivar reporte de tamaño para builds más rápidos
    chunkSizeWarningLimit: 2000, // Aumentar límite de advertencia a 2000KB para evitar warnings
  },
  // Optimizaciones para desarrollo
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js'],
    exclude: ['pdfjs-dist', 'mammoth', 'xlsx', 'jspdf'],
  },
}));
