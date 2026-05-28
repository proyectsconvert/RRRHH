// vite.config.ts
import { defineConfig } from "file:///sessions/wizardly-loving-hopper/mnt/RH/node_modules/vite/dist/node/index.js";
import react from "file:///sessions/wizardly-loving-hopper/mnt/RH/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
var __vite_injected_original_dirname = "/sessions/wizardly-loving-hopper/mnt/RH";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: true,
    port: 8080
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: true
  },
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    // Optimizaciones para producción
    // minify: 'terser', // Desactivado temporalmente para debug
    terserOptions: {
      compress: {
        drop_console: true,
        // Elimina console.log en producción
        drop_debugger: true,
        // Elimina debugger statements
        pure_funcs: ["console.log", "console.info", "console.debug"]
        // Elimina funciones específicas
      }
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (id.includes("pdfjs-dist")) {
              return "vendor-pdf";
            }
            if (id.includes("mammoth") || id.includes("xlsx") || id.includes("jspdf")) {
              return "vendor-utils";
            }
            return "vendor";
          }
        }
      }
    },
    // Generar sourcemaps solo en desarrollo
    sourcemap: mode === "development",
    // Optimizaciones adicionales
    cssCodeSplit: true,
    reportCompressedSize: false,
    // Desactivar reporte de tamaño para builds más rápidos
    chunkSizeWarningLimit: 2e3
    // Aumentar límite de advertencia a 2000KB para evitar warnings
  },
  // Optimizaciones para desarrollo
  optimizeDeps: {
    include: ["react", "react-dom", "@supabase/supabase-js"],
    exclude: ["pdfjs-dist", "mammoth", "xlsx", "jspdf"]
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvc2Vzc2lvbnMvd2l6YXJkbHktbG92aW5nLWhvcHBlci9tbnQvUkhcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9zZXNzaW9ucy93aXphcmRseS1sb3ZpbmctaG9wcGVyL21udC9SSC92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vc2Vzc2lvbnMvd2l6YXJkbHktbG92aW5nLWhvcHBlci9tbnQvUkgvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0LXN3Y1wiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4gKHtcclxuICBzZXJ2ZXI6IHtcclxuICAgIGhvc3Q6IHRydWUsXHJcbiAgICBwb3J0OiA4MDgwLFxyXG4gIH0sXHJcbiAgcHJldmlldzoge1xyXG4gICAgaG9zdDogdHJ1ZSxcclxuICAgIHBvcnQ6IDQxNzMsXHJcbiAgICBzdHJpY3RQb3J0OiB0cnVlLFxyXG4gIH0sXHJcbiAgcGx1Z2luczogW1xyXG4gICAgcmVhY3QoKSxcclxuICBdLFxyXG4gIHJlc29sdmU6IHtcclxuICAgIGFsaWFzOiB7XHJcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxyXG4gICAgfSxcclxuICB9LFxyXG4gIGJ1aWxkOiB7XHJcbiAgICAvLyBPcHRpbWl6YWNpb25lcyBwYXJhIHByb2R1Y2NpXHUwMEYzblxyXG4gICAgLy8gbWluaWZ5OiAndGVyc2VyJywgLy8gRGVzYWN0aXZhZG8gdGVtcG9yYWxtZW50ZSBwYXJhIGRlYnVnXHJcbiAgICB0ZXJzZXJPcHRpb25zOiB7XHJcbiAgICAgIGNvbXByZXNzOiB7XHJcbiAgICAgICAgZHJvcF9jb25zb2xlOiB0cnVlLCAvLyBFbGltaW5hIGNvbnNvbGUubG9nIGVuIHByb2R1Y2NpXHUwMEYzblxyXG4gICAgICAgIGRyb3BfZGVidWdnZXI6IHRydWUsIC8vIEVsaW1pbmEgZGVidWdnZXIgc3RhdGVtZW50c1xyXG4gICAgICAgIHB1cmVfZnVuY3M6IFsnY29uc29sZS5sb2cnLCAnY29uc29sZS5pbmZvJywgJ2NvbnNvbGUuZGVidWcnXSwgLy8gRWxpbWluYSBmdW5jaW9uZXMgZXNwZWNcdTAwRURmaWNhc1xyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgbWFudWFsQ2h1bmtzOiAoaWQpID0+IHtcclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnbm9kZV9tb2R1bGVzJykpIHtcclxuICAgICAgICAgICAgLy8gU29sbyBzZXBhcmFtb3MgbGFzIGxpYnJlclx1MDBFRGFzIG1cdTAwRTFzIHBlc2FkYXNcclxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdwZGZqcy1kaXN0JykpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gJ3ZlbmRvci1wZGYnO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnbWFtbW90aCcpIHx8IGlkLmluY2x1ZGVzKCd4bHN4JykgfHwgaWQuaW5jbHVkZXMoJ2pzcGRmJykpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gJ3ZlbmRvci11dGlscyc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gRWwgcmVzdG8gcXVlIHNlIG1hbmVqZSBwb3IgZGVmZWN0byBvIGVuIHVuIHNvbG8gY2h1bmsgZGUgdmVuZG9yXHJcbiAgICAgICAgICAgIHJldHVybiAndmVuZG9yJztcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIC8vIEdlbmVyYXIgc291cmNlbWFwcyBzb2xvIGVuIGRlc2Fycm9sbG9cclxuICAgIHNvdXJjZW1hcDogbW9kZSA9PT0gJ2RldmVsb3BtZW50JyxcclxuICAgIC8vIE9wdGltaXphY2lvbmVzIGFkaWNpb25hbGVzXHJcbiAgICBjc3NDb2RlU3BsaXQ6IHRydWUsXHJcbiAgICByZXBvcnRDb21wcmVzc2VkU2l6ZTogZmFsc2UsIC8vIERlc2FjdGl2YXIgcmVwb3J0ZSBkZSB0YW1hXHUwMEYxbyBwYXJhIGJ1aWxkcyBtXHUwMEUxcyByXHUwMEUxcGlkb3NcclxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMjAwMCwgLy8gQXVtZW50YXIgbFx1MDBFRG1pdGUgZGUgYWR2ZXJ0ZW5jaWEgYSAyMDAwS0IgcGFyYSBldml0YXIgd2FybmluZ3NcclxuICB9LFxyXG4gIC8vIE9wdGltaXphY2lvbmVzIHBhcmEgZGVzYXJyb2xsb1xyXG4gIG9wdGltaXplRGVwczoge1xyXG4gICAgaW5jbHVkZTogWydyZWFjdCcsICdyZWFjdC1kb20nLCAnQHN1cGFiYXNlL3N1cGFiYXNlLWpzJ10sXHJcbiAgICBleGNsdWRlOiBbJ3BkZmpzLWRpc3QnLCAnbWFtbW90aCcsICd4bHN4JywgJ2pzcGRmJ10sXHJcbiAgfSxcclxufSkpO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXVTLFNBQVMsb0JBQW9CO0FBQ3BVLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFGakIsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQSxFQUN6QyxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sWUFBWTtBQUFBLEVBQ2Q7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxFQUNSO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUE7QUFBQTtBQUFBLElBR0wsZUFBZTtBQUFBLE1BQ2IsVUFBVTtBQUFBLFFBQ1IsY0FBYztBQUFBO0FBQUEsUUFDZCxlQUFlO0FBQUE7QUFBQSxRQUNmLFlBQVksQ0FBQyxlQUFlLGdCQUFnQixlQUFlO0FBQUE7QUFBQSxNQUM3RDtBQUFBLElBQ0Y7QUFBQSxJQUNBLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLGNBQWMsQ0FBQyxPQUFPO0FBQ3BCLGNBQUksR0FBRyxTQUFTLGNBQWMsR0FBRztBQUUvQixnQkFBSSxHQUFHLFNBQVMsWUFBWSxHQUFHO0FBQzdCLHFCQUFPO0FBQUEsWUFDVDtBQUNBLGdCQUFJLEdBQUcsU0FBUyxTQUFTLEtBQUssR0FBRyxTQUFTLE1BQU0sS0FBSyxHQUFHLFNBQVMsT0FBTyxHQUFHO0FBQ3pFLHFCQUFPO0FBQUEsWUFDVDtBQUVBLG1CQUFPO0FBQUEsVUFDVDtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBO0FBQUEsSUFFQSxXQUFXLFNBQVM7QUFBQTtBQUFBLElBRXBCLGNBQWM7QUFBQSxJQUNkLHNCQUFzQjtBQUFBO0FBQUEsSUFDdEIsdUJBQXVCO0FBQUE7QUFBQSxFQUN6QjtBQUFBO0FBQUEsRUFFQSxjQUFjO0FBQUEsSUFDWixTQUFTLENBQUMsU0FBUyxhQUFhLHVCQUF1QjtBQUFBLElBQ3ZELFNBQVMsQ0FBQyxjQUFjLFdBQVcsUUFBUSxPQUFPO0FBQUEsRUFDcEQ7QUFDRixFQUFFOyIsCiAgIm5hbWVzIjogW10KfQo=
