import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true,
    port: 8080,
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: true,
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
    // minify: 'terser', // Desactivado temporalmente para debug
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
          if (id.includes('node_modules')) {
            // Solo separamos las librerías más pesadas
            if (id.includes('pdfjs-dist')) {
              return 'vendor-pdf';
            }
            if (id.includes('mammoth') || id.includes('xlsx') || id.includes('jspdf')) {
              return 'vendor-utils';
            }
            // El resto que se maneje por defecto o en un solo chunk de vendor
            return 'vendor';
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
