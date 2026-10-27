import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";

// server.ts reads the rate-limit env at module load, so configure a tiny
// limit before importing it. Vitest gives each test file a fresh module
// registry, and afterAll restores the shared worker env for any test
// files that run later in this worker.
process.env.CIVICFEED_RATE_LIMIT_MAX = "2";
process.env.CIVICFEED_RATE_LIMIT_WINDOW_MS = "60000";

const { app } = await import("./server.js");

afterAll(() => {
  process.env.CIVICFEED_RATE_LIMIT_MAX = "10000";
  delete process.env.CIVICFEED_RATE_LIMIT_WINDOW_MS;
});

describe("API rate limiting", () => {
  it("returns 429 once the configured request limit is exceeded", async () => {
    const first = await request(app).get("/api/health");
    const second = await request(app).get("/api/ready");
    const third = await request(app).get("/api/feeds");

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
    expect(third.headers["retry-after"]).toBeDefined();
  });

  it("keeps limiting subsequent requests within the window", async () => {
    const res = await request(app).get("/api/feeds");
    expect(res.status).toBe(429);
  });
});
