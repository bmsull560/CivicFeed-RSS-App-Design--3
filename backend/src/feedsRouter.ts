import express from "express";
import { type Request, type Response, type Router } from "express";
import { db } from "./db.js";
import { logger } from "./logger.js";
import { type Feed } from "./feeds.js";

export const feedsRouter = (): Router => {
  const router = express.Router();

  // Get all feeds
  router.get("/", (_req, res) => {
    try {
      const feeds = db.prepare("SELECT * FROM feeds").all() as Feed[];
      res.json(feeds);
    } catch (error) {
      logger.error("Failed to fetch feeds", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get feed by ID
  router.get("/:id", (req, res) => {
    try {
      const feed = db.prepare("SELECT * FROM feeds WHERE id = ?").get(req.params.id) as Feed | undefined;
      if (!feed) {
        res.status(404).json({ error: "Feed not found" });
        return;
      }
      res.json(feed);
    } catch (error) {
      logger.error("Failed to fetch feed", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create feed
  router.post("/", (req, res) => {
    try {
      const { name, shortName, agency, description, rssUrl, website, department, category, subCategory, contentType, updateFrequency } = req.body;
      
      if (!name || !rssUrl) {
        res.status(400).json({ error: "Name and RSS URL are required" });
        return;
      }

      const result = db.prepare(`
        INSERT INTO feeds (name, short_name, agency, description, rss_url, website, department, category, sub_category, content_type, update_frequency, status, health_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL)
      `).run(
        name,
        shortName || null,
        agency || null,
        description || null,
        rssUrl,
        website || null,
        department || null,
        category || null,
        subCategory || null,
        contentType || null,
        updateFrequency || null
      );

      const newFeed = db.prepare("SELECT * FROM feeds WHERE id = ?").get(result.lastInsertRowid) as Feed;
      res.status(201).json(newFeed);
    } catch (error) {
      logger.error("Failed to create feed", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update feed
  router.put("/:id", (req, res) => {
    try {
      const { name, shortName, agency, description, rssUrl, website, department, category, subCategory, contentType, updateFrequency } = req.body;
      
      const existing = db.prepare("SELECT * FROM feeds WHERE id = ?").get(req.params.id) as Feed | undefined;
      if (!existing) {
        res.status(404).json({ error: "Feed not found" });
        return;
      }

      db.prepare(`
        UPDATE feeds 
        SET name = ?, short_name = ?, agency = ?, description = ?, rss_url = ?, website = ?, 
            department = ?, category = ?, sub_category = ?, content_type = ?, update_frequency = ?
        WHERE id = ?
      `).run(
        name ?? existing.name,
        shortName ?? existing.shortName,
        agency ?? existing.agency,
        description ?? existing.description,
        rssUrl ?? existing.rssUrl,
        website ?? existing.website,
        department ?? existing.department,
        category ?? existing.category,
        subCategory ?? existing.subCategory,
        contentType ?? existing.contentType,
        updateFrequency ?? existing.updateFrequency,
        req.params.id
      );

      const updatedFeed = db.prepare("SELECT * FROM feeds WHERE id = ?").get(req.params.id) as Feed;
      res.json(updatedFeed);
    } catch (error) {
      logger.error("Failed to update feed", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete feed
  router.delete("/:id", (req, res) => {
    try {
      const existing = db.prepare("SELECT * FROM feeds WHERE id = ?").get(req.params.id) as Feed | undefined;
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