// Feed-registry drift guard (Invariant: feedRegistry ↔ feeds.ts id sets must stay identical).
//
// Mirrored-field contract (verified by inspecting both sources):
//   contracts/feedRegistry.ts  FeedRegistryEntry { id, name, agency, rssUrl, category }
//   src/data/feeds.ts          Feed             { id, name, shortName, agency, rssUrl, category, ... }
// The registry's `name` mirrors feeds.ts `shortName` (NOT `name` — e.g. feed-002 has
// name "Federal Register USDA Rules" but shortName/registry name "Register USDA Rules").
// The registry's `rssUrl` mirrors feeds.ts `rssUrl`. (`agency` and `category` are also
// mirrored but are outside this node's assertion scope.)
// feedRegistry.ts is AUTO-GENERATED from feeds.ts; any failure here means the registry
// must be regenerated — do not edit this test to mask drift.
import { describe, it, expect } from "vitest";
import { feedRegistry, feedRegistryById } from "@contracts/feedRegistry";
import { feeds } from "../../data/feeds";

describe("feedRegistry ↔ feeds.ts drift guard", () => {
  it("contains exactly 505 entries in each source", () => {
    expect(feedRegistry).toHaveLength(505);
    expect(feeds).toHaveLength(505);
  });

  it("has identical id sets in both directions (no extras, no duplicates)", () => {
    const registryIds = feedRegistry.map((f) => f.id);
    const feedIds = feeds.map((f) => f.id);
    expect(new Set(registryIds).size).toBe(registryIds.length);
    expect(new Set(feedIds).size).toBe(feedIds.length);
    expect([...registryIds].sort()).toEqual([...feedIds].sort());
  });

  it("keeps feedRegistryById consistent with feedRegistry", () => {
    expect(feedRegistryById.size).toBe(feedRegistry.length);
    for (const entry of feedRegistry) {
      expect(feedRegistryById.get(entry.id)).toEqual(entry);
    }
  });

  it("mirrors name (registry.name === feeds.shortName) and rssUrl for every id", () => {
    const feedsById = new Map(feeds.map((f) => [f.id, f]));
    const nameDrift: string[] = [];
    const rssDrift: string[] = [];
    for (const entry of feedRegistry) {
      const feed = feedsById.get(entry.id);
      if (!feed) {
        nameDrift.push(`${entry.id}: missing from feeds.ts`);
        continue;
      }
      if (entry.name !== feed.shortName) {
        nameDrift.push(
          `${entry.id}: registry name ${JSON.stringify(entry.name)} !== feeds shortName ${JSON.stringify(feed.shortName)}`,
        );
      }
      if (entry.rssUrl !== feed.rssUrl) {
        rssDrift.push(
          `${entry.id}: registry rssUrl ${JSON.stringify(entry.rssUrl)} !== feeds rssUrl ${JSON.stringify(feed.rssUrl)}`,
        );
      }
    }
    expect(nameDrift).toEqual([]);
    expect(rssDrift).toEqual([]);
  });
});
