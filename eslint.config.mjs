import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Prevent the import path issues we just fixed
      "@typescript-eslint/no-explicit-any": "warn", // Changed from error to warn
      "@typescript-eslint/no-unused-vars": ["warn", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],
      
      // Prevent common Next.js issues
      "@next/next/no-img-element": "warn",
      "react-hooks/exhaustive-deps": "warn",
      
      // Enforce proper TypeScript usage
      "@typescript-eslint/no-var-requires": "error",
      
      // Prevent common React issues
      "react/jsx-key": "error",
      "react/no-unescaped-entities": "warn",
      
      // Prevent data.data patterns in API responses
      "no-restricted-properties": [
        "error",
        {
          "object": "data",
          "property": "data",
          "message": "Avoid data.data patterns. Use flattened response structure instead."
        }
      ],
    },
  },
  {
    files: ["**/api/**/*.ts", "**/api/**/*.tsx"],
    rules: {
      // Ensure API routes are thin wrappers
      "max-lines-per-function": ["warn", { "max": 50 }],
      "complexity": ["warn", { "max": 10 }],
    },
  },
  {
    files: ["**/services/**/*.ts"],
    rules: {
      // Allow more complexity in service layer
      "max-lines-per-function": ["warn", { "max": 100 }],
      "complexity": ["warn", { "max": 20 }],
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/test-setup.ts", "**/test-utils-auth.ts"],
    rules: {
      // Allow any types in test files for flexibility
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "max-lines-per-function": "off",
      "complexity": "off",
    },
  },
];

export default eslintConfig;
