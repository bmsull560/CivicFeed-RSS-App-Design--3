// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { safeUrl } from "../url";

describe("safeUrl", () => {
  it("allows absolute https URLs", () => {
    expect(safeUrl("https://www.fda.gov/feed.xml")).toBe("https://www.fda.gov/feed.xml");
  });
  it("allows http URLs", () => {
    expect(safeUrl("http://example.com/x")).toBe("http://example.com/x");
  });
  it("neutralizes javascript: URIs", () => {
    expect(safeUrl("javascript:alert(1)")).toBe("#");
  });
  it("neutralizes data: URIs", () => {
    expect(safeUrl("data:text/html,<script>alert(1)</script>")).toBe("#");
  });
  it("neutralizes vbscript: and file: URIs", () => {
    expect(safeUrl("vbscript:msgbox(1)")).toBe("#");
    expect(safeUrl("file:///etc/passwd")).toBe("#");
  });
  it("resolves relative/garbage input to the app origin (harmless same-origin navigation)", () => {
    // Not a security issue: these become http(s) links to our own origin, never script execution.
    const u1 = safeUrl("ht tp://bad url");
    expect(u1.startsWith("http")).toBe(true);
    expect(u1).not.toContain("javascript:");
  });
  it("is case-insensitive to scheme obfuscation", () => {
    expect(safeUrl("JaVaScRiPt:alert(1)")).toBe("#");
  });
});
