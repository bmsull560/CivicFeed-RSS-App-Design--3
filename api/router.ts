import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Errors } from "@contracts/errors";
import { createRouter, publicQuery } from "./middleware";
import {
  getFeedPayload,
  getValidationMap,
  getLatestRun,
  runValidationSweep,
} from "./queries/feeds";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),

  feeds: createRouter({
    getFeed: publicQuery
      .input(z.object({ feedId: z.string().min(1).max(191) }))
      .query(({ input }) => getFeedPayload(input.feedId)),

    getValidationStatus: publicQuery.query(async () => {
      const rows = await getValidationMap();
      const latestRun = await getLatestRun();
      return {
        statuses: rows.map((r) => ({
          feedId: r.feedId,
          lastStatus: r.lastStatus,
          lastCheckedAt: r.lastCheckedAt,
          httpCode: r.httpCode,
          latencyMs: r.latencyMs,
          failStreak: r.failStreak,
        })),
        latestRun,
      };
    }),

    runValidation: publicQuery
      .input(
        z
          .object({
            secret: z.string().optional(),
            feedIds: z.array(z.string()).max(600).optional(),
          })
          .optional()
      )
      .mutation(async ({ input }) => {
        const required = process.env.VALIDATION_SECRET;
        if (required && input?.secret !== required) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: Errors.unauthorized("unauthorized").message,
          });
        }
        return runValidationSweep({ feedIds: input?.feedIds });
      }),
  }),
});

export type AppRouter = typeof appRouter;
