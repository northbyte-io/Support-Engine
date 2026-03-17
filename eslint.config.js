import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript recommended rules for all TS files
  ...tseslint.configs.recommended,

  // Allow _ prefix for intentionally unused vars/args globally
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "destructuredArrayIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }]
    }
  },

  // React Hooks rules for client code only
  {
    files: ["client/src/**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },

  // Forbid console.log on the server (use server/logger.ts instead)
  {
    files: ["server/**/*.ts"],
    rules: {
      "no-console": "error",
    },
  },

  // Globally ignored paths
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "migrations/**",
      "client/src/components/ui/**", // shadcn/ui — don't modify
    ],
  },
);
