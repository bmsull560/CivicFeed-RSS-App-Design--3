import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// Use an in-memory SQLite database for all tests.
process.env.CIVICFEED_DB_PATH = ":memory:";
// Keep test output focused; the logger still writes JSON in production/dev.
process.env.CIVICFEED_LOG_LEVEL = "silent";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    plugins: [tsconfigPaths()],
  },
});
