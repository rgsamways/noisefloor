import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/dist/**", "**/build/**", "**/node_modules/**", "**/.vercel/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  {
    // Plain Node build scripts (e.g. packages/kb's content generator) run
    // outside any bundler, so they need Node globals explicitly rather
    // than inheriting them from a browser/DOM lib config.
    files: ["**/scripts/**/*.mjs"],
    languageOptions: {
      globals: { console: "readonly", process: "readonly" },
    },
  },
);
