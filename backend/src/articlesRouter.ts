import express from "express";
import { type Request, type Response, type Router } from "express";
import { db } from "./db.js";
import { logger } from "./logger.js";
import { getCachedArticles, saveArticles } from "./cache.js";
import { getCachedEnrichment } from "./ai.js";
import { enqueueArticleEnrichment } from "./enrichment-queue.js";
import { parseTags, getRecentArticles, searchArticles } from "./search.js";
import { fetchFeed } from "./rss.js";
import { type FeedRow } from "./db.js";
import { type Feed } from "./feeds.js";
import { type RssEntry } from "./rss.js";

export const articlesRouter = (): Router => {
  const router = express.Router();

  // Get articles for a feed (backend cache + async AI enrichment queue)
  router.get("/feeds/:id/articles", async (req, res) => {
    const feedId = req.params.id;

    const feedRow = db.prepare("SELECT * FROM feeds WHERE id = ?").get(feedId) as FeedRow | undefined;
    if (!feedRow) return res.status(404).json({ error: "Feed not found" });

    let entries: RssEntry[];
    let fromCache = false;

    // Try cache first
    const cached = getCachedArticles(feedId);
    if (cached && cached.length > 0) {
      entries = cached.map((a) => ({
        id: a.entryId,
        title: a.title,
        link: a.link,
        description: a.description,
        pubDate: a.pubDate,
        author: a.author || undefined,
        categories: a.categories || undefined,
        feedId: a.feedId,
        feedName: feedRow.name,
        fetchedAt: a.fetchedAt,
      }));
      fromCache = true;
    } else {
      // Fetch fresh
      const result = await fetchFeed(feedRow.rss_url, feedId, feedRow.name);
      if (result.error) {
        return res.status(502).json({ entries: [], cached: false, error: result.error });
      }
      entries = result.entries;
      saveArticles(feedId, result.entries);
    }

    // Attach cached enrichments and queue missing ones for background processing.
    const enrichedEntries = entries.map((entry) => {
      const enrichment = getCachedEnrichment(entry.id);
      if (!enrichment) {
        enqueueArticleEnrichment(entry.id, feedId, entry.title, entry.description);
      }
      return {
        ...entry,
        aiSummary: enrichment?.summary,
        aiSummarySource: enrichment?.summarySource,
        aiTags: enrichment?.tags,
      };
    });

    const etag = `"feed-${feedId}-${entries[0]?.fetchedAt ?? 0}"`;
    res.setHeader("ETag", etag);
    res.setHeader("Cache-Control", "private, must-revalidate, max-age=60");

    res.json({
      entries: enrichedEntries,
      cached: fromCache,
      error: null,
    });
  });

  // Search articles
  router.get("/search", (req, res) => {
    const q = (req.query.q as string) || "";
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
    if (!q.trim()) {
      const recent = getRecentArticles(limit, offset);
      return res.json({ query: "", results: recent, total: recent.length });
    }
    const results = searchArticles(q, limit, offset);
    res.json({ query: q, results, total: results.length });
  });

  // Recent articles (optionally filtered by source feed)
  router.get("/articles/recent", (req, res) => {
    const source = (req.query.source as string) || "";
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
    let results = getRecentArticles(limit, offset);
    if (source) {
      results = results.filter((r) => r.feedId === source);
    }
    res.json({ results });
  });

  // Fetch cached articles by entry id (used for bookmarks/archive)
  router.post("/articles/by-ids", express.json(), (req, res) => {
    const ids = req.body?.ids as string[] | undefined;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.json({ results: [] });
    }
    const cappedIds = ids.slice(0, 500);
    const placeholders = cappedIds.map(() => "?").join(",");

    const stmt = db.prepare(`
      SELECT
        ac.entry_id AS entry_id,
        ac.feed_id AS feed_id,
        ac.title AS title,
        ac.link AS link,
        ac.description AS description,
        ac.pub_date AS pub_date,
        ac.author AS author,
        f.name AS feed_name,
        (SELECT summary FROM article_summaries WHERE entry_id = ac.entry_id) AS ai_summary,
        (SELECT json_group_array(tag) FROM article_tags WHERE entry_id = ac.entry_id) AS ai_tags
      FROM article_cache AS ac
      JOIN feeds AS f ON ac.feed_id = f.id
      WHERE ac.entry_id IN (${placeholders})
    `);

    const rows = stmt.all(...cappedIds) as ArticleByIdRow[];
    const results = rows.map((r) => ({
      entryId: r.entry_id,
      feedId: r.feed_id,
      title: r.title,
      link: r.link,
      description: r.description,
      pubDate: r.pub_date,
      author: r.author,
      feedName: r.feed_name,
      aiSummary: r.ai_summary,
      aiTags: parseTags(r.ai_tags),
    }));

    res.json({ results });
  });

  return router;
};