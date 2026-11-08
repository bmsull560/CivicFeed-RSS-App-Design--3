import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { feeds } from "./feeds.js";
import { applyMigrations, civicfeedMigrations } from "./migrations.js";
import { logger } from "./logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.CIVICFEED_DB_PATH || path.resolve(__dirname, "../data/civicfeed.db");

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

applyMigrations(db, civicfeedMigrations, logger);

function seedFeeds() {
  const insert = db.prepare(`
    INSERT INTO feeds
    (id, name, short_name, agency, description, rss_url, website, department, category, sub_category, content_type, update_frequency, status, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      short_name = excluded.short_name,
      agency = excluded.agency,
      description = excluded.description,
      rss_url = excluded.rss_url,
      website = excluded.website,
      department = excluded.department,
      category = excluded.category,
      sub_category = excluded.sub_category,
      content_type = excluded.content_type,
      update_frequency = excluded.update_frequency,
      status = excluded.status,
      tags = excluded.tags
  `);

  db.transaction(() => {
    for (const feed of feeds) {
      insert.run(
        feed.id,
        feed.name,
        feed.shortName,
        feed.agency,
        feed.description,
        feed.rssUrl,
        feed.website,
        feed.department,
        feed.category,
        feed.subCategory,
        feed.contentType,
        feed.updateFrequency,
        feed.status,
        JSON.stringify(feed.tags)
      );
    }

    const placeholders = feeds.map(() => "?").join(", ");
    db.prepare(`DELETE FROM feeds WHERE id NOT IN (${placeholders})`).run(
      ...feeds.map((feed) => feed.id)
    );
  })();

  console.log(`Synced ${feeds.length} feeds.`);
}

// Auto-seed if running directly, if --seed flag passed, or if using in-memory DB for tests
if (
  process.argv.includes("--seed") ||
  import.meta.url === `file://${process.argv[1]}` ||
  process.env.CIVICFEED_DB_PATH === ":memory:"
) {
  seedFeeds();
}

export { seedFeeds };

export interface FeedRow {
  id: string;
  name: string;
  short_name: string;
  agency: string;
  description: string;
  rss_url: string;
  website: string;
  department: string;
  category: string;
  sub_category: string;
  content_type: string;
  update_frequency: string;
  status: string;
  tags: string;
  health_status: string | null;
  health_checked_at: number | null;
  health_error: string | null;
}

export interface ArticleByIdRow {
  entry_id: string;
  feed_id: string;
  title: string;
  link: string;
  description: string;
  pub_date: string;
  author: string | null;
  feed_name: string;
  ai_summary: string | null;
}
