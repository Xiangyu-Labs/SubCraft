import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "integration",
    environment: "node",
    globals: true,
    include: ["tests/integration/**/*.test.ts"],
  },
});
