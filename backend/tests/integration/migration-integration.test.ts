import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { db } from "./db.js";
import { applyMigrations, civicfeedMigrations } from "./migrations.js";

describe("Migration Chain Integration", () => {
  beforeEach(async () => {
    // Clear the migrations table for each test
    db.exec("DELETE FROM migrations");
  });

  afterEach(async () => {
    // Clean up
  });

  it("applies all 5 migrations in order on fresh database", () => {
    let appliedCount = 0;

    for (const migration of civicfeedMigrations) {
      db.transaction(() => {
        migration.up(db);
      })();
      appliedCount++;
    }

    // Verify all migrations were applied
    const rows = db.prepare("SELECT id, name FROM migrations ORDER BY id").all() as { id: number; name: string }[];
    expect(rows).toHaveLength(5);
    expect(rows[0].name).toBe("initial_schema");
    expect(rows[4].name).toBe("enrichment_jobs_queue");
  });

  it("is idempotent: re-running migrations does not duplicate entries", () => {
    // Apply all migrations first
    for (const migration of civicfeedMigrations) {
      db.transaction(() => {
        migration.up(db);
      })();
    }

    // Record initial state
    const before = db.prepare("SELECT COUNT(*) as c FROM migrations").get() as { c: number };

    // Apply again - should be idempotent
    for (const migration of civicfeedMigrations) {
      db.transaction(() => {
        migration.up(db);
      })();
    }

    const after = db.prepare("SELECT COUNT(*) as c FROM migrations").get() as { c: number };
    expect(after.c).toBe(before.c);
  });

  it("rejects database schema ahead of application code", () => {
    // Apply all migrations
    for (const migration of civicfeedMigrations) {
      db.transaction(() => {
        migration.up(db);
      })();
    }

    // Now try to apply a fake higher migration
    const fakeMigration = {
      id: 10,
      name: "fake_migration",
      up: (db: any) => { db.exec("CREATE TABLE fake (id INTEGER)"); };
    };

    // This should throw because DB is ahead of known migrations
    let threw = false;
    try {
      applyMigrations(db, [fakeMigration], { info: () => {}, warn: () => {} });
    } catch (e: any) {
      threw = e.message.includes("Database schema is ahead of application code");
    }
    
    expect(threw).toBe(true);
  });
});