import { describe, it, expect, vi, afterEach } from "vitest";
import {
  isAllowedFeedUrl,
  countItems,
  classify,
  fetchFeedRemote,
  runValidationSweep,
  tryAcquireSweepLock,
  releaseSweepLock,
  type FetchOutcome,
} from "../feeds";

describe("isAllowedFeedUrl", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("accepts https .gov URLs (including subdomains)", () => {
    expect(isAllowedFeedUrl("https://www.fda.gov/rss/news.xml")).toBe(true);
    expect(isAllowedFeedUrl("https://data.city.gov/feed")).toBe(true);
  });

  it("accepts https .mil URLs (including subdomains)", () => {
    expect(isAllowedFeedUrl("https://www.defense.gov/rss")).toBe(true);
    expect(isAllowedFeedUrl("https://news.army.mil/feed")).toBe(true);
  });

  it("accepts http URLs on allowed hosts", () => {
    expect(isAllowedFeedUrl("http://example.gov/feed.xml")).toBe(true);
  });

  it("rejects non-.gov/.mil hosts", () => {
    expect(isAllowedFeedUrl("https://example.com/feed.xml")).toBe(false);
    expect(isAllowedFeedUrl("https://evilgov.com/rss")).toBe(false);
    expect(isAllowedFeedUrl("https://gov.evil.com/rss")).toBe(false);
  });

  it("rejects non-http(s) schemes", () => {
    expect(isAllowedFeedUrl("javascript:alert(1)")).toBe(false);
    expect(isAllowedFeedUrl("ftp://example.gov/feed")).toBe(false);
    expect(isAllowedFeedUrl("file:///etc/passwd")).toBe(false);
  });

  it("rejects malformed strings", () => {
    expect(isAllowedFeedUrl("not a url")).toBe(false);
    expect(isAllowedFeedUrl("")).toBe(false);
    expect(isAllowedFeedUrl("//example.gov")).toBe(false);
  });

  it("warns when rejecting a URL (surfaces malformed registry entries)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(isAllowedFeedUrl("not a url")).toBe(false);
    expect(warn).toHaveBeenCalled();
  });
});

describe("countItems", () => {
  it("counts RSS <item> elements", () => {
    const xml = `<?xml version="1.0"?><rss version="2.0"><channel>
      <item><title>a</title></item>
      <item><title>b</title></item>
      <item><title>c</title></item>
    </channel></rss>`;
    expect(countItems(xml)).toBe(3);
  });

  it("counts Atom <entry> elements", () => {
    const xml = `<feed xmlns="http://www.w3.org/2005/Atom">
      <entry><title>a</title></entry>
      <entry><title>b</title></entry>
    </feed>`;
    expect(countItems(xml)).toBe(2);
  });

  it("returns 0 for empty or itemless documents", () => {
    expect(countItems("")).toBe(0);
    expect(countItems("<rss><channel></channel></rss>")).toBe(0);
  });
});

describe("fetchFeedRemote redirect re-validation (R1)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("rejects a redirect to a non-allowlisted host without fetching it", async () => {
    const fetchMock = vi.fn(async (input: unknown) => {
      void input;
      return new Response(null, {
        status: 302,
        headers: { location: "https://evil.com/steal.xml" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const outcome = await fetchFeedRemote("https://www.fda.gov/rss/news.xml");
    expect(outcome.kind).toBe("dead");
    if (outcome.kind !== "ok") {
      expect(outcome.error).toBe("redirect to non-allowlisted host");
    }
    // Only the original allowlisted URL was ever fetched.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe("https://www.fda.gov/rss/news.xml");
  });

  it("follows a relative redirect resolved against the current allowlisted URL", async () => {
    const xml = "<rss><channel><item>x</item></channel></rss>";
    const fetchMock = vi.fn(async (input: unknown) => {
      const url = String(input);
      if (url === "https://www.fda.gov/old") {
        return new Response(null, { status: 301, headers: { location: "/rss/news.xml" } });
      }
      if (url === "https://www.fda.gov/rss/news.xml") {
        return new Response(xml, { status: 200 });
      }
      throw new Error(`unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const outcome = await fetchFeedRemote("https://www.fda.gov/old");
    expect(outcome.kind).toBe("ok");
    if (outcome.kind === "ok") {
      expect(outcome.xml).toBe(xml);
    }
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rejects bodies larger than the 5MB cap", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const chunk = new Uint8Array(1024 * 1024); // 1MB
        for (let i = 0; i < 6; i++) controller.enqueue(chunk);
        controller.close();
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(stream, { status: 200 })),
    );

    const outcome = await fetchFeedRemote("https://www.fda.gov/rss/news.xml");
    expect(outcome.kind).toBe("dead");
    if (outcome.kind !== "ok") {
      expect(outcome.error).toBe("response body exceeds 5MB cap");
    }
  });
});

describe("runValidationSweep mutex (R2b)", () => {
  afterEach(() => {
    releaseSweepLock();
  });

  it("refuses a second sweep while one is in flight (no DB touched)", async () => {
    expect(tryAcquireSweepLock()).toBe(true);
    try {
      const result = await runValidationSweep();
      expect(result).toEqual({ status: "already_running" });
    } finally {
      releaseSweepLock();
    }
  });
});

describe("classify", () => {
  const err = (kind: "blocked" | "dead" | "timeout", httpCode: number | null): FetchOutcome => ({
    kind,
    httpCode,
    latencyMs: 10,
    error: httpCode == null ? "boom" : `HTTP ${httpCode}`,
  });

  it("maps 401/403 to blocked", () => {
    expect(classify(err("blocked", 401))).toBe("blocked");
    expect(classify(err("blocked", 403))).toBe("blocked");
  });

  it("maps 404/410 to dead", () => {
    expect(classify(err("dead", 404))).toBe("dead");
    expect(classify(err("dead", 410))).toBe("dead");
  });

  it("maps 5xx to timeout", () => {
    expect(classify(err("timeout", 500))).toBe("timeout");
    expect(classify(err("timeout", 503))).toBe("timeout");
  });

  it("maps network errors without a status code through their kind", () => {
    expect(classify(err("timeout", null))).toBe("timeout");
    expect(classify(err("dead", null))).toBe("dead");
  });

  it("ok with items is working", () => {
    expect(
      classify({ kind: "ok", xml: "<rss><channel><item>x</item></channel></rss>", httpCode: 200, latencyMs: 5 }),
    ).toBe("working");
  });

  it("ok with no items is dead", () => {
    expect(
      classify({ kind: "ok", xml: "<rss><channel></channel></rss>", httpCode: 200, latencyMs: 5 }),
    ).toBe("dead");
  });
});
