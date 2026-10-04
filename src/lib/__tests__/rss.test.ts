// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { parseRssXml, fetchFeed } from "../rss";

function makeFetch(impl: (url: string) => Response | Promise<Response> | Error) {
  const calls: string[] = [];
  const fetchImpl = async (input: RequestInfo | URL): Promise<Response> => {
    const url = String(input);
    calls.push(url);
    const out = await impl(url);
    if (out instanceof Error) throw out;
    return out;
  };
  return { calls, fetchImpl: fetchImpl as typeof fetch };
}

function xmlResponse(xml: string): Response {
  return new Response(xml, { status: 200 });
}

const RSS2_DOC = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Example Feed</title>
    <item>
      <title>First Post</title>
      <link>https://example.com/first</link>
      <description>A description of the first post</description>
      <pubDate>Mon, 01 Jan 2024 10:00:00 GMT</pubDate>
      <guid>https://example.com/first</guid>
    </item>
    <item>
      <title>Second Post</title>
      <link>https://example.com/second</link>
      <description>Second description</description>
      <pubDate>Tue, 02 Jan 2024 10:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

const ATOM_DOC = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Atom Example</title>
  <entry>
    <title>Atom Entry One</title>
    <link rel="alternate" href="https://example.com/atom-1"/>
    <id>urn:uuid:atom-1</id>
    <updated>2024-03-05T12:00:00Z</updated>
    <summary>Atom summary one</summary>
  </entry>
  <entry>
    <title>Atom Entry Two</title>
    <link href="https://example.com/atom-2"/>
    <id>urn:uuid:atom-2</id>
    <published>2024-03-04T09:30:00Z</published>
    <updated>2024-03-06T09:30:00Z</updated>
    <content>Atom content two</content>
  </entry>
</feed>`;

describe("parseRssXml", () => {
  it("returns parsed items from an RSS 2.0 feed", () => {
    const entries = parseRssXml(RSS2_DOC, "feed-1", "Example");
    expect(entries).toHaveLength(2);
    expect(entries[0].title).toBe("First Post");
    expect(entries[0].link).toBe("https://example.com/first");
    expect(entries[0].description).toBe("A description of the first post");
    expect(entries[0].pubDate).toBe(new Date("2024-01-01T10:00:00Z").toISOString());
    expect(entries[0].feedId).toBe("feed-1");
    expect(entries[0].feedName).toBe("Example");
    // stable entry IDs: guid used when present, deterministic hash otherwise
    expect(entries[0].id).toBe("https://example.com/first");
    expect(entries[1].id).toBe(parseRssXml(RSS2_DOC, "feed-1", "Example")[1].id);
    expect(entries[1].id).not.toBe(entries[0].id);
  });

  it("returns parsed entries from an Atom feed", () => {
    const entries = parseRssXml(ATOM_DOC, "feed-2", "Atom");
    expect(entries).toHaveLength(2);
    expect(entries[0].title).toBe("Atom Entry One");
    expect(entries[0].link).toBe("https://example.com/atom-1");
    expect(entries[0].description).toBe("Atom summary one");
    expect(entries[0].pubDate).toBe("2024-03-05T12:00:00.000Z");
    expect(entries[0].id).toBe("urn:uuid:atom-1");
    expect(entries[1].link).toBe("https://example.com/atom-2");
    // published is preferred over updated
    expect(entries[1].pubDate).toBe("2024-03-04T09:30:00.000Z");
  });

  it("falls back to HTML parsing and still extracts item text for malformed XML", () => {
    const malformed = `<rss version="2.0"><channel>
      <item><title>Broken & Raw < Title</title><link>https://example.com/broken</link>
      <description>Malformed but readable</description></item>
      <item><title>Other</title><link>https://example.com/other</link></item>
      </channel>`;
    const entries = parseRssXml(malformed, "feed-3", "Broken");
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.some(e => e.link === "https://example.com/broken")).toBe(true);
  });

  it("uses the epoch sentinel instead of the current time for missing or unparseable RSS pubDates", () => {
    const doc = `<?xml version="1.0"?><rss version="2.0"><channel>
      <item><title>No Date</title><link>https://example.com/nodate</link></item>
      <item><title>Bad Date</title><link>https://example.com/baddate</link><pubDate>not a real date</pubDate></item>
      </channel></rss>`;
    const before = Date.now();
    const entries = parseRssXml(doc, "feed-bad", "BadDates");
    const after = Date.now();
    expect(entries).toHaveLength(2);
    for (const e of entries) {
      expect(e.pubDate).toBe("1970-01-01T00:00:00.000Z");
      const t = new Date(e.pubDate).getTime();
      expect(t < before || t > after).toBe(true);
    }
  });

  it("uses the epoch sentinel instead of the current time for missing Atom dates", () => {
    const doc = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom">
      <entry><title>No Date Atom</title><link href="https://example.com/atom-nodate"/><id>urn:1</id></entry>
      </feed>`;
    const before = Date.now();
    const entries = parseRssXml(doc, "feed-atom-bad", "AtomBad");
    const after = Date.now();
    expect(entries).toHaveLength(1);
    expect(entries[0].pubDate).toBe("1970-01-01T00:00:00.000Z");
    const t = new Date(entries[0].pubDate).getTime();
    expect(t < before || t > after).toBe(true);
  });

  it("still parses valid RSS and Atom dates correctly", () => {
    const rss = parseRssXml(RSS2_DOC, "feed-1", "Example");
    expect(rss[0].pubDate).toBe("2024-01-01T10:00:00.000Z");
    const atom = parseRssXml(ATOM_DOC, "feed-2", "Atom");
    expect(atom[0].pubDate).toBe("2024-03-05T12:00:00.000Z");
    expect(atom[1].pubDate).toBe("2024-03-04T09:30:00.000Z");
  });

  it("returns an empty list for a valid XML document with no items", () => {
    const doc = `<?xml version="1.0"?><rss version="2.0"><channel><title>Empty</title></channel></rss>`;
    expect(parseRssXml(doc, "feed-4", "Empty")).toEqual([]);
  });
});

describe("fetchFeed", () => {
  it("returns entries from a direct fetch without ever requesting a proxy URL", async () => {
    const { calls, fetchImpl } = makeFetch(() => xmlResponse(RSS2_DOC));
    const result = await fetchFeed("https://example.com/feed.xml", "f1", "Feed One", { fetchImpl });
    expect(result.error).toBeNull();
    expect(result.entries).toHaveLength(2);
    expect(calls).toEqual(["https://example.com/feed.xml"]);
  });

  it("tries proxies in configured order when the direct fetch fails and the first success wins", async () => {
    const { calls, fetchImpl } = makeFetch((url) => {
      if (url.includes("codetabs")) return xmlResponse(RSS2_DOC);
      return new Error("network down");
    });
    const result = await fetchFeed("https://example.com/feed.xml", "f1", "Feed One", { fetchImpl });
    expect(result.error).toBeNull();
    expect(result.entries).toHaveLength(2);
    expect(calls[0]).toBe("https://example.com/feed.xml");
    expect(calls[1]).toContain("allorigins");
    expect(calls[2]).toContain("codetabs");
    expect(calls).toHaveLength(3); // corsproxy never attempted after codetabs succeeded
  });

  it("returns an error result listing every attempt when direct and all proxies fail, and never throws", async () => {
    const { calls, fetchImpl } = makeFetch(() => new Error("boom"));
    const result = await fetchFeed("https://example.com/feed.xml", "f1", "Feed One", { fetchImpl });
    expect(result.entries).toEqual([]);
    expect(result.error).not.toBeNull();
    expect(result.error).toContain("4 attempts"); // 1 direct + 3 proxies
    expect(result.error).toContain("boom");
    expect(calls).toHaveLength(4);
  });

  it("rejects a non-https feed URL immediately with an error result and zero network attempts", async () => {
    const { calls, fetchImpl } = makeFetch(() => xmlResponse(RSS2_DOC));
    const result = await fetchFeed("http://example.com/feed.xml", "f1", "Feed One", { fetchImpl });
    expect(result.entries).toEqual([]);
    expect(result.error).not.toBeNull();
    expect(result.error).toMatch(/https/i);
    expect(calls).toHaveLength(0);
  });

  it("aborts a fetch that never resolves after the configured timeout and counts it as a failed attempt", async () => {
    const never = async (): Promise<Response> => new Promise<Response>(() => {});
    const result = await fetchFeed("https://example.com/feed.xml", "f1", "Feed One", {
      fetchImpl: never as typeof fetch,
      timeoutMs: 50,
    });
    expect(result.entries).toEqual([]);
    expect(result.error).not.toBeNull();
    expect(result.error).toMatch(/Timeout after 50ms/);
    expect(result.error).toContain("4 attempts");
  });
});
