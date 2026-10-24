import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import { db } from "./db.js";
import { app } from "./server.js";
import { insertTestFeed, makeEntry } from "./test-helpers.js";
import { saveArticles } from "./cache.js";

describe("server", () => {
  beforeAll(() => {
    // Seed at least one feed for feed-dependent tests.
    insertTestFeed({ id: "feed-server", name: "Server Test Feed" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("GET /api/health returns ok with database check", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.timestamp).toBeDefined();
    expect(res.body.checks.database).toBe(true);
    expect(res.body.checks.feedsCount).toBeGreaterThanOrEqual(1);
    expect(res.body.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });

  it("GET /api/ready returns ready when database is accessible", async () => {
    const res = await request(app).get("/api/ready");
    expect(res.status).toBe(200);
    expect(res.body.ready).toBe(true);
    expect(res.body.timestamp).toBeDefined();
  });

  it("GET /api/feeds lists seeded feeds", async () => {
    const res = await request(app).get("/api/feeds");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.feeds)).toBe(true);
    expect(res.body.feeds.some((f: { id: string }) => f.id === "feed-server")).toBe(true);
  });

  it("GET /api/feeds/:id returns a single feed", async () => {
    const res = await request(app).get("/api/feeds/feed-server");
    expect(res.status).toBe(200);
    expect(res.body.id).toBe("feed-server");
  });

  it("GET /api/feeds/:id returns 404 for unknown feed", async () => {
    const res = await request(app).get("/api/feeds/does-not-exist");
    expect(res.status).toBe(404);
  });

  it("GET /api/feeds/:id/articles fetches articles and enriches them asynchronously", async () => {
    const xml = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Server Entry</title>
      <link>https://example.com/server-entry</link>
      <description>Test entry for server endpoint.</description>
      <pubDate>Mon, 15 Jun 2026 12:00:00 GMT</pubDate>
      <guid>server-entry-1</guid>
    </item>
  </channel>
</rss>`;

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(xml, { status: 200 }))
    );

    // Initial request returns articles immediately; enrichment is queued.
    const res = await request(app).get("/api/feeds/feed-server/articles");
    expect(res.status).toBe(200);
    expect(res.body.entries).toHaveLength(1);
    expect(res.body.entries[0].title).toBe("Server Entry");

    // Process the queued enrichment job and re-fetch.
    const { processEnrichmentBatch } = await import("./enrichment-queue.js");
    await processEnrichmentBatch(10, 1);

    const enriched = await request(app).get("/api/feeds/feed-server/articles");
    expect(enriched.status).toBe(200);
    expect(enriched.body.entries[0].aiSummary).toBeDefined();
    expect(enriched.body.entries[0].aiTags).toBeDefined();
  });

  it("GET /api/search returns results", async () => {
    saveArticles("feed-server", [
      makeEntry({ id: "searchable", title: "Searchable Article" }, "feed-server"),
    ]);

    const res = await request(app).get("/api/search?q=Searchable");
    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(1);
    expect(res.body.results[0].entryId).toBe("searchable");
  });

  it("GET /api/stats/cache returns counts", async () => {
    const res = await request(app).get("/api/stats/cache");
    expect(res.status).toBe(200);
    expect(typeof res.body.totalArticles).toBe("number");
    expect(typeof res.body.cachedFeeds).toBe("number");
  });

  it("GET /api/recap returns a recap", async () => {
    saveArticles("feed-server", [
      makeEntry({ id: "recap", title: "Recap Article" }, "feed-server"),
    ]);

    const res = await request(app).get("/api/recap?days=7");
    expect(res.status).toBe(200);
    expect(res.body.totalArticles).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.categories)).toBe(true);
  });

  describe("feed status and stats", () => {
    const statusFeedId = "feed-status-test";

    beforeAll(() => {
      insertTestFeed({
        id: statusFeedId,
        name: "Status Test Feed",
        rssUrl: "https://example.com/status-feed.xml",
      });
    });

    beforeEach(() => {
      db.prepare("DELETE FROM feed_fetch_status WHERE feed_id = ?").run(statusFeedId);
      db.prepare("DELETE FROM article_cache WHERE feed_id = ?").run(statusFeedId);
      db.prepare("DELETE FROM article_summaries WHERE feed_id = ?").run(statusFeedId);
      db.prepare("DELETE FROM article_tags WHERE feed_id = ?").run(statusFeedId);
    });

    it("GET /api/feeds/:id/status returns defaults when never fetched", async () => {
      const res = await request(app).get(`/api/feeds/${statusFeedId}/status`);
      expect(res.status).toBe(200);
      expect(res.body.feedId).toBe(statusFeedId);
      expect(res.body.lastSuccessAt).toBeNull();
      expect(res.body.lastErrorAt).toBeNull();
      expect(res.body.attemptCount).toBe(0);
      expect(res.body.successCount).toBe(0);
      expect(res.body.failureCount).toBe(0);
    });

    it("GET /api/feeds/:id/status reflects a successful fetch", async () => {
      const xml = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Status Entry</title>
      <link>https://example.com/status-entry</link>
      <description>Test status entry.</description>
      <pubDate>Mon, 15 Jun 2026 12:00:00 GMT</pubDate>
      <guid>status-entry-1</guid>
    </item>
  </channel>
</rss>`;

      vi.stubGlobal(
        "fetch",
        vi.fn(async () => new Response(xml, { status: 200 }))
      );

      const articleRes = await request(app).get(`/api/feeds/${statusFeedId}/articles`);
      expect(articleRes.status).toBe(200);

      const res = await request(app).get(`/api/feeds/${statusFeedId}/status`);
      expect(res.status).toBe(200);
      expect(res.body.feedId).toBe(statusFeedId);
      expect(res.body.attemptCount).toBe(1);
      expect(res.body.successCount).toBe(1);
      expect(res.body.failureCount).toBe(0);
      expect(res.body.lastSuccessAt).toBeGreaterThan(0);
      expect(res.body.lastErrorAt).toBeNull();
      expect(res.body.nextFetchAt).toBeGreaterThan(res.body.lastSuccessAt);
    });

    it("GET /api/feeds/:id/status reflects a failed fetch", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => new Response("Server Error", { status: 500 }))
      );

      const articleRes = await request(app).get(`/api/feeds/${statusFeedId}/articles`);
      expect(articleRes.status).toBe(502);

      const res = await request(app).get(`/api/feeds/${statusFeedId}/status`);
      expect(res.status).toBe(200);
      expect(res.body.attemptCount).toBe(1);
      expect(res.body.successCount).toBe(0);
      expect(res.body.failureCount).toBe(1);
      expect(res.body.lastErrorAt).toBeGreaterThan(0);
      expect(res.body.lastErrorMessage).toContain("500");
    });

    it("GET /api/feeds/:id/status returns 404 for unknown feed", async () => {
      const res = await request(app).get("/api/feeds/does-not-exist/status");
      expect(res.status).toBe(404);
    });

    it("GET /api/stats/feeds returns aggregate counts", async () => {
      const res = await request(app).get("/api/stats/feeds");
      expect(res.status).toBe(200);
      expect(typeof res.body.totalFeeds).toBe("number");
      expect(typeof res.body.workingFeeds).toBe("number");
      expect(typeof res.body.feedsWithStatus).toBe("number");
      expect(typeof res.body.feedsWithRecentError).toBe("number");
      expect(typeof res.body.staleFeeds).toBe("number");
    });
  });

  describe("feed creation", () => {
    const validFeed = {
      name: "Created Feed Test",
      short_name: "Created Feed Test",
      agency: "Test Agency",
      description: "A feed created through the API",
      rss_url: "https://example.com/created-feed.xml",
      website: "https://example.com",
      department: "Test Department",
      category: "General",
      sub_category: "Notices",
      content_type: "news",
      update_frequency: "daily",
    };

    it("POST /api/feeds creates a feed with a generated id and returns it in camelCase", async () => {
      const res = await request(app).post("/api/feeds").send(validFeed);
      expect(res.status).toBe(201);
      expect(res.body.id).toBe("created-feed-test");
      expect(res.body.name).toBe(validFeed.name);
      expect(res.body.shortName).toBe(validFeed.short_name);
      expect(res.body.rssUrl).toBe(validFeed.rss_url);
      expect(res.body.status).toBe("pending");
      expect(res.body.tags).toEqual([]);

      const fetched = await request(app).get("/api/feeds/created-feed-test");
      expect(fetched.status).toBe(200);
      expect(fetched.body.id).toBe("created-feed-test");
      expect(fetched.body.agency).toBe(validFeed.agency);
    });

    it("POST /api/feeds returns 400 when required fields are missing", async () => {
      const res = await request(app)
        .post("/api/feeds")
        .send({ name: "Incomplete Feed", rss_url: "https://example.com/feed.xml" });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("short_name");
      expect(res.body.error).toContain("agency");
      expect(res.body.error).toContain("website");
      expect(res.body.error).toContain("category");
    });

    it("POST /api/feeds returns 400 for a non-HTTP rss_url", async () => {
      const res = await request(app)
        .post("/api/feeds")
        .send({ ...validFeed, short_name: "Bad Url Test", rss_url: "not-a-url" });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("rss_url");

      const ftpRes = await request(app)
        .post("/api/feeds")
        .send({ ...validFeed, short_name: "Bad Url Test", rss_url: "ftp://example.com/feed.xml" });
      expect(ftpRes.status).toBe(400);
      expect(ftpRes.body.error).toContain("rss_url");
    });

    it("POST /api/feeds suffixes the generated id when the slug is taken", async () => {
      insertTestFeed({ id: "collision-feed", shortName: "Collision Feed" });

      const res = await request(app)
        .post("/api/feeds")
        .send({ ...validFeed, name: "Collision Feed", short_name: "Collision Feed" });
      expect(res.status).toBe(201);
      expect(res.body.id).toBe("collision-feed-2");
    });

    it("POST /api/feeds trims separator characters from generated ids", async () => {
      const res = await request(app)
        .post("/api/feeds")
        .send({ ...validFeed, name: "Spaced Feed", short_name: " - Spaced Feed - " });
      expect(res.status).toBe(201);
      expect(res.body.id).toBe("spaced-feed");
    });
  });
});
