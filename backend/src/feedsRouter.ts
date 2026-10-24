import express from "express";
import { type Router } from "express";
import { db, type FeedRow } from "./db.js";
import { logger } from "./logger.js";

// Maps a snake_case database row to the camelCase shape served by the API.
const mapFeedRow = (row: FeedRow) => ({
  id: row.id,
  name: row.name,
  shortName: row.short_name,
  agency: row.agency,
  description: row.description,
  rssUrl: row.rss_url,
  website: row.website,
  department: row.department,
  category: row.category,
  subCategory: row.sub_category,
  contentType: row.content_type,
  updateFrequency: row.update_frequency,
  status: row.status,
  tags: JSON.parse(row.tags ?? "[]"),
  healthStatus: row.health_status,
  healthCheckedAt: row.health_checked_at,
  healthError: row.health_error,
});

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

// Generates a stable text id from the feed's short name, appending a numeric
// suffix when the slug is already taken.
const generateFeedId = (base: string): string => {
  const slug = slugify(base) || "feed";
  for (let attempt = 1; attempt < 100; attempt++) {
    const candidate = attempt === 1 ? slug : `${slug}-${attempt}`;
    const existing = db.prepare("SELECT 1 FROM feeds WHERE id = ?").get(candidate);
    if (!existing) return candidate;
  }
  return `${slug}-${Date.now().toString(36)}`;
};

export const feedsRouter = (): Router => {
  const router = express.Router();

  // Get all feeds
  router.get("/feeds", (_req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM feeds ORDER BY name").all() as FeedRow[];
      const feeds = rows.map(mapFeedRow);

      const categories = new Set<string>();
      for (const feed of feeds) categories.add(feed.category);
      const categoryList = [...categories].sort();

      const totalFeeds = feeds.length;
      const workingFeeds = feeds.filter((f) => f.status === "working").length;
      const feedStats = {
        total: totalFeeds,
        working: workingFeeds,
        categories: categoryList.length,
      };

      res.json({ feeds, categoryList, feedStats });
    } catch (error) {
      logger.error("Failed to fetch feeds", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get feed by ID
  router.get("/feeds/:id", (req, res) => {
    try {
      const row = db.prepare("SELECT * FROM feeds WHERE id = ?").get(req.params.id) as
        FeedRow | undefined;
      if (!row) {
        res.status(404).json({ error: "Feed not found" });
        return;
      }
      res.json(mapFeedRow(row));
    } catch (error) {
      logger.error("Failed to fetch feed", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create feed
  router.post("/feeds", (req, res) => {
    try {
      const {
        name,
        short_name,
        agency,
        description,
        rss_url,
        website,
        department,
        category,
        sub_category,
        content_type,
        update_frequency,
      } = req.body;

      // The feeds table requires these columns to be NOT NULL, so reject
      // requests that omit them instead of failing with a 500 on insert.
      const requiredFields: Record<string, unknown> = {
        name,
        short_name,
        agency,
        rss_url,
        website,
        category,
      };
      const missing = Object.entries(requiredFields)
        .filter(([, value]) => typeof value !== "string" || value.trim() === "")
        .map(([field]) => field);
      if (missing.length > 0) {
        res.status(400).json({ error: `Missing required fields: ${missing.join(", ")}` });
        return;
      }

      let parsedRssUrl: URL;
      try {
        parsedRssUrl = new URL(rss_url);
      } catch {
        res.status(400).json({ error: "rss_url must be a valid URL" });
        return;
      }
      if (parsedRssUrl.protocol !== "http:" && parsedRssUrl.protocol !== "https:") {
        res.status(400).json({ error: "rss_url must use the http or https protocol" });
        return;
      }

      const id = generateFeedId(short_name);

      db.prepare(
        `
        INSERT INTO feeds (id, name, short_name, agency, description, rss_url, website, department, category, sub_category, content_type, update_frequency, status, tags, health_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', '[]', NULL)
      `
      ).run(
        id,
        name,
        short_name,
        agency,
        description || null,
        rss_url,
        website,
        department || null,
        category,
        sub_category || null,
        content_type || null,
        update_frequency || null
      );

      const newFeed = db.prepare("SELECT * FROM feeds WHERE id = ?").get(id) as FeedRow;
      res.status(201).json(mapFeedRow(newFeed));
    } catch (error) {
      logger.error("Failed to create feed", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update feed
  router.put("/feeds/:id", (req, res) => {
    try {
      const {
        name,
        short_name,
        agency,
        description,
        rss_url,
        website,
        department,
        category,
        sub_category,
        content_type,
        update_frequency,
      } = req.body;

      const existing = db.prepare("SELECT * FROM feeds WHERE id = ?").get(req.params.id) as
        FeedRow | undefined;
      if (!existing) {
        res.status(404).json({ error: "Feed not found" });
        return;
      }

      db.prepare(
        `
        UPDATE feeds 
        SET name = ?, short_name = ?, agency = ?, description = ?, rss_url = ?, website = ?, 
            department = ?, category = ?, sub_category = ?, content_type = ?, update_frequency = ?
        WHERE id = ?
      `
      ).run(
        name ?? existing.name,
        short_name ?? existing.short_name,
        agency ?? existing.agency,
        description ?? existing.description,
        rss_url ?? existing.rss_url,
        website ?? existing.website,
        department ?? existing.department,
        category ?? existing.category,
        sub_category ?? existing.sub_category,
        content_type ?? existing.content_type,
        update_frequency ?? existing.update_frequency,
        req.params.id
      );

      const updatedFeed = db
        .prepare("SELECT * FROM feeds WHERE id = ?")
        .get(req.params.id) as FeedRow;
      res.json(mapFeedRow(updatedFeed));
    } catch (error) {
      logger.error("Failed to update feed", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete feed
  router.delete("/feeds/:id", (req, res) => {
    try {
      const existing = db.prepare("SELECT * FROM feeds WHERE id = ?").get(req.params.id) as
        FeedRow | undefined;
      if (!existing) {
        res.status(404).json({ error: "Feed not found" });
        return;
      }

      db.prepare("DELETE FROM feeds WHERE id = ?").run(req.params.id);
      res.status(204).send();
    } catch (error) {
      logger.error("Failed to delete feed", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
};
