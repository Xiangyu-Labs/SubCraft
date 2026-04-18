import next from "eslint-config-next";

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  ...next,
  {
    rules: {
      // App Router uses <link> in layout.tsx for fonts, not pages/_document.js
      "@next/next/no-page-custom-font": "off",
    },
  },
];

export default eslintConfig;
