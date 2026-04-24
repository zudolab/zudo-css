import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const DIST_DIR = join(import.meta.dirname, "../dist");
const SITE_URL = "https://takazudomodular.com";

function collectHtmlFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectHtmlFiles(full));
    } else if (entry.endsWith(".html")) {
      files.push(full);
    }
  }
  return files;
}

function getMetaContent(
  html: string,
  attr: "property" | "name",
  value: string,
): string | null {
  const re = new RegExp(`<meta\\s+${attr}="${value}"\\s+content="([^"]*)"`, "i");
  const match = html.match(re);
  return match?.[1] ?? null;
}

const htmlFiles = collectHtmlFiles(DIST_DIR);
const pageFiles = htmlFiles.filter((f) => !f.endsWith("/404.html"));

describe("OGP meta tags on all pages", () => {
  it("should have at least one page to test", () => {
    expect(pageFiles.length).toBeGreaterThan(0);
  });

  describe.each(pageFiles.map((f) => [relative(DIST_DIR, f), f]))(
    "%s",
    (_rel, filePath) => {
      const html = readFileSync(filePath as string, "utf-8");

      it("has og:title", () => {
        expect(getMetaContent(html, "property", "og:title")).toBeTruthy();
      });

      it("has og:type", () => {
        expect(getMetaContent(html, "property", "og:type")).toBe("website");
      });

      it("has og:url with production domain", () => {
        const url = getMetaContent(html, "property", "og:url");
        expect(url).toBeTruthy();
        expect(url).toMatch(new RegExp(`^${SITE_URL}`));
        expect(url).not.toContain("localhost");
      });

      it("has og:image with production domain", () => {
        const image = getMetaContent(html, "property", "og:image");
        expect(image).toBeTruthy();
        expect(image).toMatch(new RegExp(`^${SITE_URL}`));
        expect(image).not.toContain("localhost");
      });

      it("has og:site_name", () => {
        expect(getMetaContent(html, "property", "og:site_name")).toBeTruthy();
      });

      it("has twitter:card", () => {
        expect(getMetaContent(html, "name", "twitter:card")).toBe(
          "summary_large_image",
        );
      });
    },
  );
});
