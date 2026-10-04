/**
 * URL scheme allowlist for untrusted (feed- or proxy-derived) URLs.
 * Anything that is not absolute http(s) is neutralized to "#".
 * Relative URLs resolve against the app origin and are allowed as https.
 */
export function safeUrl(url: string): string {
  try {
    const u = new URL(url, window.location.origin);
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : "#";
  } catch {
    return "#";
  }
}
