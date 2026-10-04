import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TRPCError } from "@trpc/server";

// Stub the sweep/query layer at the module boundary: no DB or network in tests.
vi.mock("../queries/feeds", () => ({
  getFeedPayload: vi.fn(),
  getValidationMap: vi.fn(async () => []),
  getLatestRun: vi.fn(async () => null),
  runValidationSweep: vi.fn(async () => ({
    runId: 1,
    totals: { working: 0, blocked: 0, dead: 0, timeout: 0 },
    checked: 0,
  })),
}));

import { appRouter } from "../router";
import { runValidationSweep } from "../queries/feeds";
import type { TrpcContext } from "../context";

const ctx = { req: new Request("http://localhost"), resHeaders: new Headers() } as TrpcContext;
const caller = appRouter.createCaller(ctx);

describe("feeds.runValidation authorization", () => {
  const OLD_SECRET = process.env.VALIDATION_SECRET;

  beforeEach(() => {
    process.env.VALIDATION_SECRET = "top-secret";
    vi.mocked(runValidationSweep).mockClear();
  });

  afterEach(() => {
    if (OLD_SECRET === undefined) {
      delete process.env.VALIDATION_SECRET;
    } else {
      process.env.VALIDATION_SECRET = OLD_SECRET;
    }
  });

  it("rejects with a TRPCError UNAUTHORIZED when the secret is wrong/missing", async () => {
    const err = await caller.feeds
      .runValidation({ secret: "wrong" })
      .then(() => null)
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("UNAUTHORIZED");
    expect(runValidationSweep).not.toHaveBeenCalled();
  });

  it("runs the sweep when the secret matches", async () => {
    await expect(
      caller.feeds.runValidation({ secret: "top-secret" }),
    ).resolves.toMatchObject({ runId: 1, checked: 0 });
    expect(runValidationSweep).toHaveBeenCalledTimes(1);
  });
});
