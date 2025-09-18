import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "node_modules",
      ".env*",
      "public",
      "*.config.js",
      "*.config.ts"
    ]
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      // Reglas optimizadas para producción
      "@typescript-eslint/no-unused-vars": "off", // Mantener off para desarrollo
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/prefer-const": "error",
      "@typescript-eslint/no-var-requires": "error",

      // Reglas de rendimiento
      "react-hooks/exhaustive-deps": "warn",

      // Reglas de seguridad
      "no-console": process.env.NODE_ENV === "production" ? "error" : "warn",
      "no-debugger": process.env.NODE_ENV === "production" ? "error" : "warn",
      "no-alert": "error",

      // Reglas de calidad de código
      "no-duplicate-imports": "error",
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-arrow-callback": "error",

      // Reglas específicas de React
      "react-hooks/rules-of-hooks": "error",
    },
  },
  // Configuración específica para archivos de configuración
  {
    files: ["*.config.{js,ts}", "vite.config.{js,ts}"],
    rules: {
      "no-console": "off", // Permitir console.log en archivos de configuración
      "@typescript-eslint/no-var-requires": "off",
    },
  },
  // Configuración específica para archivos de desarrollo/testing
  {
    files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}", "**/__tests__/**"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "no-console": "off",
    },
  }
);
