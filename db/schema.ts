import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  json,
  int,
  timestamp,
} from "drizzle-orm/mysql-core";

// Cached raw feed payloads served to the frontend. One row per registry feed.
export const feedEntriesCache = mysqlTable("feed_entries_cache", {
  feedId: varchar("feed_id", { length: 191 }).primaryKey(),
  feedName: varchar("feed_name", { length: 255 }).notNull(),
  // Raw RSS/Atom XML text (frontend parses with its tested parser).
  xml: text("xml"),
  fetchedAt: timestamp("fetched_at").notNull().defaultNow(),
  httpStatus: int("http_status"),
  error: text("error"),
});

// Latest validation outcome per feed.
export const feedValidation = mysqlTable("feed_validation", {
  feedId: varchar("feed_id", { length: 191 }).primaryKey(),
  lastCheckedAt: timestamp("last_checked_at").notNull().defaultNow(),
  lastStatus: mysqlEnum("last_status", [
    "working",
    "blocked",
    "dead",
    "timeout",
  ]).notNull(),
  httpCode: int("http_code"),
  latencyMs: int("latency_ms"),
  failStreak: int("fail_streak").notNull().default(0),
});

// One row per scheduled validation sweep.
export const validationRuns = mysqlTable("validation_runs", {
  id: serial("id").primaryKey(),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  finishedAt: timestamp("finished_at"),
  totals: json("totals"),
});
