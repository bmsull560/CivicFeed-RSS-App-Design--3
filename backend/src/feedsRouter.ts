import express from "express";
import { type Router } from "express";
import { db, type FeedRow } from "./db.js";
import { logger } from "./logger.js";

export const feedsRouter = (): Router => {
  const router = express.Router();

  // Get all feeds
  router.get("/feeds", (_req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM feeds ORDER BY name").all() as FeedRow[];
      const feeds = rows.map((r) => ({
        id: r.id,
        name: r.name,
        shortName: r.short_name,
        agency: r.agency,
        description: r.description,
        rssUrl: r.rss_url,
        website: r.website,
        department: r.department,
        category: r.category,
        subCategory: r.sub_category,
        contentType: r.content_type,
        updateFrequency: r.update_frequency,
        status: r.status,
        tags: JSON.parse(r.tags),
        healthStatus: r.health_status,
        healthCheckedAt: r.health_checked_at,
        healthError: r.health_error,
      }));

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
      res.json({
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
        tags: JSON.parse(row.tags),
        healthStatus: row.health_status,
        healthCheckedAt: row.health_checked_at,
        healthError: row.health_error,
      });
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

      if (!name || !rss_url) {
        res.status(400).json({ error: "Name and RSS URL are required" });
        return;
      }

      const result = db
        .prepare(
          `
        INSERT INTO feeds (name, short_name, agency, description, rss_url, website, department, category, sub_category, content_type, update_frequency, status, health_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL)
      `
        )
        .run(
          name,
          short_name || null,
          agency || null,
          description || null,
          rss_url,
          website || null,
          department || null,
          category || null,
          sub_category || null,
          content_type || null,
          update_frequency || null
        );

      const newFeed = db
        .prepare("SELECT * FROM feeds WHERE id = ?")
        .get(result.lastInsertRowid) as FeedRow;
      res.status(201).json(newFeed);
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
      res.json(updatedFeed);
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
