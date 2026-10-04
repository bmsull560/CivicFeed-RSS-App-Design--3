import type { RssEntry, FetchResult } from "../types";

const PROXY_SOURCES: { name: string; url: (u: string) => string; extract: (t: string) => string }[] = [
  { name: "allorigins", url: (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`, extract: (t) => t },
  { name: "codetabs", url: (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`, extract: (t) => t },
  { name: "corsproxy", url: (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`, extract: (t) => t },
];

const DEFAULT_TIMEOUT_MS = 15000;

export interface FetchFeedOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

/** Deterministic 32-bit FNV-1a hash, hex-encoded, for stable fallback entry IDs. */
function hashString(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

/** Epoch sentinel for missing/unparseable dates — never the current time. */
const EPOCH_ISO = "1970-01-01T00:00:00.000Z";

function toIso(dateStr: string | null | undefined): string {
  if (!dateStr) return EPOCH_ISO;
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? EPOCH_ISO : d.toISOString();
}

function text(el: Element | null | undefined, selector: string): string {
  return el?.querySelector(selector)?.textContent?.trim() ?? "";
}

function atomLink(entry: Element): string {
  const links = Array.from(entry.querySelectorAll("link"));
  const alt = links.find(l => (l.getAttribute("rel") ?? "alternate") === "alternate");
  return (alt ?? links[0])?.getAttribute("href") ?? "";
}

export function parseRssXml(xmlText: string, feedId: string, feedName: string): RssEntry[] {
  let doc = new DOMParser().parseFromString(xmlText, "text/xml");
  let items = Array.from(doc.querySelectorAll("item"));
  let atomEntries = Array.from(doc.querySelectorAll("entry"));
  if (items.length === 0 && atomEntries.length === 0) {
    // Malformed XML fallback: HTML parsing is lenient and still finds tags.
    doc = new DOMParser().parseFromString(xmlText, "text/html");
    items = Array.from(doc.querySelectorAll("item"));
    atomEntries = Array.from(doc.querySelectorAll("entry"));
  }
  const now = Date.now();
  if (items.length > 0) {
    return items.map(item => {
      const link = text(item, "link");
      const guid = text(item, "guid");
      const title = text(item, "title");
      return {
        id: guid || link || `entry-${hashString(`${feedId}|${title}|${link}`)}`,
        title,
        link,
        description: text(item, "description"),
        pubDate: toIso(text(item, "pubDate")),
        author: text(item, "author") || undefined,
        feedId,
        feedName,
        fetchedAt: now,
      };
    });
  }
  return atomEntries.map(entry => {
    const link = atomLink(entry);
    const idTag = text(entry, "id");
    const title = text(entry, "title");
    return {
      id: idTag || link || `entry-${hashString(`${feedId}|${title}|${link}`)}`,
      title,
      link,
      description: text(entry, "summary") || text(entry, "content"),
      pubDate: toIso(text(entry, "published") || text(entry, "updated")),
      author: text(entry, "author name") || undefined,
      feedId,
      feedName,
      fetchedAt: now,
    };
  });
}

async function fetchWithTimeout(url: string, timeoutMs: number, fetchImpl: typeof fetch): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchFeed(feedUrl: string, feedId: string, feedName: string, options: FetchFeedOptions = {}): Promise<FetchResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  // SSRF/scheme guard: only https feeds are ever requested (dataset is all-https).
  if (!feedUrl.startsWith("https://")) {
    return { entries: [], error: `Rejected non-https feed URL: ${feedUrl}` };
  }
  const attempts: { label: string; url: string }[] = [
    { label: "direct", url: feedUrl },
    ...PROXY_SOURCES.map(p => ({ label: p.name, url: p.url(feedUrl) })),
  ];
  const errors: string[] = [];
  for (const attempt of attempts) {
    try {
      const res = await fetchWithTimeout(attempt.url, timeoutMs, fetchImpl);
      if (!res.ok) { errors.push(`${attempt.label}: HTTP ${res.status}`); continue; }
      const textBody = await res.text();
      const entries = parseRssXml(textBody, feedId, feedName);
      if (entries.length === 0) { errors.push(`${attempt.label}: 0 entries parsed`); continue; }
      return { entries, error: null };
    } catch (e) {
      const msg = e instanceof Error && e.name === "AbortError" ? `Timeout after ${timeoutMs}ms` : (e instanceof Error ? e.message : String(e));
      errors.push(`${attempt.label}: ${msg}`);
    }
  }
  return { entries: [], error: `${attempts.length} attempts failed — ${errors.join("; ")}` };
}
