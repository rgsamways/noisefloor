import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["apps/*/src/**/*.test.ts", "packages/*/src/**/*.test.ts"],
    // Many api test files share one real dev Postgres instance and a
    // singleton seeded `entities` row (no per-test transaction/schema
    // isolation) — running test files in parallel races inserts/deletes
    // against that shared state, causing intermittent FK-violation and
    // rule-lookup failures that have nothing to do with the code under
    // test. Sequential file execution trades test-run speed for
    // determinism.
    fileParallelism: false,
  },
});
