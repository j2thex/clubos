import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    testTimeout: 10_000,
    hookTimeout: 10_000,
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
  },
});
