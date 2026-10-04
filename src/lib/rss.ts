import type { RssEntry, FetchResult } from "../types";

const PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

function generateEntryId(link: string, title: string, pubDate: string): string {
  const str = `${link}::${title}::${pubDate}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `entry-${Math.abs(hash).toString(36)}`;
}

/**
 * Sentinel for missing/unparseable dates: the Unix epoch. Never silently
 * substitute the current time, which would corrupt chronological sorting.
 */
const UNKNOWN_DATE_SENTINEL = "1970-01-01T00:00:00.000Z";

function normalizeDate(dateStr: string): string {
  if (!dateStr) return UNKNOWN_DATE_SENTINEL;
  const cleaned = dateStr.replace(/\s+\(.*\)$/, "").trim();
  const d = new Date(cleaned);
  if (!isNaN(d.getTime())) return d.toISOString();
  const usMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (usMatch) {
    const [, m, day, y] = usMatch;
    const dd = new Date(`${y}-${m.padStart(2, "0")}-${day.padStart(2, "0")}`);
    if (!isNaN(dd.getTime())) return dd.toISOString();
  }
  return UNKNOWN_DATE_SENTINEL;
}

function extractRawTagText(item: Element, tag: string): string {
  const m = item.innerHTML.match(new RegExp(`<${tag}[^>]*>\\s*([^<]+)`, "i"));
  return m ? m[1].trim() : "";
}

function parseRssItems(items: Element[], feedId: string, feedName: string): RssEntry[] {
  const entries: RssEntry[] = [];
  const now = Date.now();
  for (const item of items) {
    const getText = (tag: string) => {
      const el = item.getElementsByTagName(tag)[0];
      return el ? el.textContent || "" : "";
    };
    const title = getText("title").trim();
    const link = getText("link").trim() || item.getElementsByTagName("guid")[0]?.textContent?.trim() || extractRawTagText(item, "link");
    const description = getText("description") || getText("content:encoded") || "";
    const pubRaw = getText("pubDate") || getText("dc:date");
    const author = getText("dc:creator") || getText("author") || undefined;
    const guid = getText("guid").trim();
    const cats: string[] = [];
    const catEls = item.getElementsByTagName("category");
    for (let i = 0; i < catEls.length; i++) {
      const t = catEls[i].textContent?.trim();
      if (t) cats.push(t);
    }
    if (!title && !link) continue;
    entries.push({
      id: guid || generateEntryId(link, title, pubRaw),
      title: title || "Untitled",
      link,
      description,
      pubDate: normalizeDate(pubRaw),
      author,
      categories: cats.length > 0 ? cats : undefined,
      feedId,
      feedName,
      fetchedAt: now,
    });
  }
  return entries;
}

function parseAtomEntries(entries: Element[], feedId: string, feedName: string): RssEntry[] {
  const result: RssEntry[] = [];
  const now = Date.now();
  for (const entry of entries) {
    const getText = (tag: string) => {
      const el = entry.getElementsByTagName(tag)[0];
      return el ? el.textContent || "" : "";
    };
    const title = getText("title").trim();
    let link = "";
    const links = entry.getElementsByTagName("link");
    for (let i = 0; i < links.length; i++) {
      const rel = links[i].getAttribute("rel");
      if (!rel || rel === "alternate") {
        link = links[i].getAttribute("href") || "";
        break;
      }
    }
    const summary = getText("summary") || getText("content") || "";
    const pubRaw = getText("published") || getText("updated");
    const id = getText("id").trim();
    let author: string | undefined;
    const authorEl = entry.getElementsByTagName("author")[0];
    if (authorEl) {
      author = authorEl.getElementsByTagName("name")[0]?.textContent || undefined;
    }
    const cats: string[] = [];
    const catEls = entry.getElementsByTagName("category");
    for (let i = 0; i < catEls.length; i++) {
      const t = catEls[i].getAttribute("term") || catEls[i].textContent;
      if (t) cats.push(t.trim());
    }
    if (!title && !link) continue;
    result.push({
      id: id || generateEntryId(link, title, pubRaw),
      title: title || "Untitled",
      link,
      description: summary,
      pubDate: normalizeDate(pubRaw),
      author,
      categories: cats.length > 0 ? cats : undefined,
      feedId,
      feedName,
      fetchedAt: now,
    });
  }
  return result;
}

export function parseRssXml(xmlText: string, feedId: string, feedName: string): RssEntry[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "application/xml");
  const parserError = doc.querySelector("parsererror");
  if (parserError) {
    const htmlDoc = parser.parseFromString(xmlText, "text/html");
    const items = htmlDoc.querySelectorAll("item");
    if (items.length > 0) {
      const elements: Element[] = [];
      items.forEach(i => elements.push(i as Element));
      return parseRssItems(elements, feedId, feedName);
    }
    return [];
  }
  const rssItems = doc.getElementsByTagName("item");
  if (rssItems.length > 0) {
    const elements: Element[] = [];
    for (let i = 0; i < rssItems.length; i++) elements.push(rssItems[i]);
    return parseRssItems(elements, feedId, feedName);
  }
  const atomEntries = doc.getElementsByTagName("entry");
  if (atomEntries.length > 0) {
    const elements: Element[] = [];
    for (let i = 0; i < atomEntries.length; i++) elements.push(atomEntries[i]);
    return parseAtomEntries(elements, feedId, feedName);
  }
  return [];
}

export interface FetchFeedOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

function fetchWithTimeout(url: string, timeoutMs: number, fetchImpl: typeof fetch): Promise<Response> {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
      reject(new Error(`Timeout after ${timeoutMs}ms`));
    }, timeoutMs);
    fetchImpl(url, { signal: controller.signal })
      .then(response => { clearTimeout(timer); resolve(response); })
      .catch(err => { clearTimeout(timer); reject(err); });
  });
}

export async function fetchFeed(url: string, feedId: string, feedName: string, options?: FetchFeedOptions): Promise<FetchResult> {
  const fetchImpl = options?.fetchImpl ?? fetch;
  const timeoutMs = options?.timeoutMs ?? 12000;
  const proxyTimeoutMs = options?.timeoutMs ?? 18000;
  const errors: string[] = [];
  if (!url.startsWith("https://")) {
    return { entries: [], error: `Rejected non-https feed URL: ${url}` };
  }
  try {
    const res = await fetchWithTimeout(url, timeoutMs, fetchImpl);
    if (res.ok) {
      const xml = await res.text();
      const entries = parseRssXml(xml, feedId, feedName);
      if (entries.length > 0) return { entries, error: null };
    }
  } catch (e) {
    errors.push(`direct: ${e instanceof Error ? e.message : String(e)}`);
  }
  for (const proxyFn of PROXIES) {
    const proxyUrl = proxyFn(url);
    try {
      const res = await fetchWithTimeout(proxyUrl, proxyTimeoutMs, fetchImpl);
      if (!res.ok) { errors.push(`proxy: HTTP ${res.status}`); continue; }
      const xml = await res.text();
      if (!xml || xml.length < 50) { errors.push(`proxy: Empty response`); continue; }
      const entries = parseRssXml(xml, feedId, feedName);
      if (entries.length > 0) return { entries, error: null };
      errors.push(`proxy: No entries parsed`);
    } catch (e) {
      errors.push(`proxy: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return {
    entries: [],
    error: `Failed after ${errors.length} attempts: ${errors.slice(0, 3).join("; ")}`,
  };
}
