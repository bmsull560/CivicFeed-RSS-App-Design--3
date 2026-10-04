import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
// Plain HTTP endpoint for the scheduled validation cron job.
// Guarded by VALIDATION_SECRET when set (header: x-validation-secret).
app.post("/api/cron/validate-feeds", async (c) => {
  const { warnIfSweepUnauthenticated } = await import("./queries/feeds");
  warnIfSweepUnauthenticated();
  const required = process.env.VALIDATION_SECRET;
  if (required && c.req.header("x-validation-secret") !== required) {
    return c.json({ error: "unauthorized" }, 401);
  }
  // Long-running endpoint: a full sweep fetches ~505 feeds with a
  // concurrency-limited pool and 15s per-fetch timeout, so the response
  // may legitimately take several minutes. Failures return a sanitized
  // 500 JSON body (no stack trace leaked to the caller).
  try {
    const { runValidationSweep } = await import("./queries/feeds");
    const result = await runValidationSweep();
    return c.json(result);
  } catch (err) {
    // Log the real error server-side; never leak err.message to the caller.
    console.error("[cron] validate-feeds sweep failed:", err);
    return c.json({ error: "validation sweep failed" }, 500);
  }
});

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
