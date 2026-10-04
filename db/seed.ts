import "dotenv/config";
import { sql } from "drizzle-orm";
import { getDb } from "../api/queries/connection";
import { feedValidation } from "./schema";
import {
  feedRegistry,
  type FeedRegistryEntry,
} from "@contracts/feedRegistry";

type FeedValidationInsert = typeof feedValidation.$inferInsert;

// Pure row-builder: one skeleton row per registry feed. `lastStatus: "dead"`
// is used as the enum-safe default for "not yet validated" (the schema enum
// has no "unknown" value); the validation sweep will overwrite it on first run.
export function buildSeedRows(
  registry: FeedRegistryEntry[],
): FeedValidationInsert[] {
  return registry.map((feed) => ({
    feedId: feed.id,
    lastStatus: "dead",
    failStreak: 0,
  }));
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error(
      "db:seed failed: DATABASE_URL is not set (check your .env file).",
    );
    process.exit(1);
  }

  const rows = buildSeedRows(feedRegistry);
  const db = getDb();

  const before = await db
    .select({ count: sql<number>`count(*)` })
    .from(feedValidation);
  const alreadyPresent = Number(before[0]?.count ?? 0);

  // Idempotent upsert: the duplicate-key update is a no-op so existing
  // validation results are never overwritten.
  await db
    .insert(feedValidation)
    .values(rows)
    .onDuplicateKeyUpdate({ set: { feedId: sql`feed_id` } });

  const after = await db
    .select({ count: sql<number>`count(*)` })
    .from(feedValidation);
  const total = Number(after[0]?.count ?? 0);
  const inserted = total - alreadyPresent;

  console.log(
    `db:seed complete: ${inserted} inserted, ${alreadyPresent} already present, ${total} total (registry size: ${rows.length}).`,
  );
  process.exit(0); // close MySQL connection pool
}

main().catch((err) => {
  console.error("db:seed failed:", err);
  process.exit(1);
});
