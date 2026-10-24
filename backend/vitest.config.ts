import { defineConfig } from "vitest/config";

// Use an in-memory SQLite database for all tests.
process.env.CIVICFEED_DB_PATH = ":memory:";
// Keep test output focused; the logger still writes JSON in production/dev.
process.env.CIVICFEED_LOG_LEVEL = "silent";
// Keep API rate limiting far above test request volumes so suites never trip 429s.
process.env.CIVICFEED_RATE_LIMIT_MAX = "10000";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
  },
});
