import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  parseBasePath,
  parseContentDirs,
  extractHtmlLinks,
  resolveLink,
  extractMdxAbsoluteLinks,
  checkHtmlLinks,
  checkMdxLinks,
  formatReport,
  collectFiles,
} from "../check-links.js";

describe("check-links", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "check-links-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true });
  });

  // --- parseBasePath ---

  describe("parseBasePath", () => {
    it("extracts base path from settings file", async () => {
      const file = join(tmpDir, "settings.ts");
      writeFileSync(
        file,
        `export const settings = {\n  base: "/pj/zudo-doc/",\n};`,
      );
      expect(await parseBasePath(file)).toBe("/pj/zudo-doc/");
    });

    it("handles single-quoted base", async () => {
      const file = join(tmpDir, "settings.ts");
      writeFileSync(file, `export const settings = { base: '/app/' };`);
      expect(await parseBasePath(file)).toBe("/app/");
    });

    it("returns / when no base is found", async () => {
      const file = join(tmpDir, "settings.ts");
      writeFileSync(file, `export const settings = {};`);
      expect(await parseBasePath(file)).toBe("/");
    });
  });

  // --- parseContentDirs ---

  describe("parseContentDirs", () => {
    it("extracts docsDir and locale dirs from settings", async () => {
      const file = join(tmpDir, "settings.ts");
      writeFileSync(
        file,
        `export const settings = {\n  docsDir: "src/content/docs",\n  docsJaDir: "src/content/docs-ja",\n};`,
      );
      const result = await parseContentDirs(file);
      expect(result.docsDir).toBe("src/content/docs");
      expect(result.localeDirs).toEqual(["src/content/docs-ja"]);
    });

    it("returns defaults when no docsDir is specified", async () => {
      const file = join(tmpDir, "settings.ts");
      writeFileSync(file, `export const settings = {};`);
      const result = await parseContentDirs(file);
      expect(result.docsDir).toBe("src/content/docs");
      expect(result.localeDirs).toEqual([]);
    });

    it("extracts multiple locale dirs", async () => {
      const file = join(tmpDir, "settings.ts");
      writeFileSync(
        file,
        `export const settings = {\n  docsDir: "src/content/docs",\n  docsJaDir: "src/content/docs-ja",\n  docsZhDir: "src/content/docs-zh",\n};`,
      );
      const result = await parseContentDirs(file);
      expect(result.localeDirs).toEqual([
        "src/content/docs-ja",
        "src/content/docs-zh",
      ]);
    });
  });

  // --- collectFiles ---

  describe("collectFiles", () => {
    it("finds files with matching extensions recursively", async () => {
      mkdirSync(join(tmpDir, "sub"), { recursive: true });
      writeFileSync(join(tmpDir, "a.html"), "");
      writeFileSync(join(tmpDir, "b.txt"), "");
      writeFileSync(join(tmpDir, "sub", "c.html"), "");

      const files = await collectFiles(tmpDir, [".html"]);
      const relative = files.map((f: string) => f.replace(tmpDir + "/", ""));
      expect(relative).toEqual(["a.html", "sub/c.html"]);
    });

    it("returns empty array for non-existent directory", async () => {
      const files = await collectFiles(join(tmpDir, "nope"), [".html"]);
      expect(files).toEqual([]);
    });
  });

  // --- extractHtmlLinks ---

  describe("extractHtmlLinks", () => {
    it("extracts internal links", () => {
      const html = `<a href="/pj/zudo-doc/docs/foo">Foo</a>`;
      expect(extractHtmlLinks(html)).toEqual([
        { href: "/pj/zudo-doc/docs/foo", line: 1 },
      ]);
    });

    it("skips external https links", () => {
      expect(extractHtmlLinks(`<a href="https://example.com">E</a>`)).toEqual(
        [],
      );
    });

    it("skips external http links", () => {
      expect(extractHtmlLinks(`<a href="http://example.com">E</a>`)).toEqual(
        [],
      );
    });

    it("skips anchor-only links", () => {
      expect(extractHtmlLinks(`<a href="#section">A</a>`)).toEqual([]);
    });

    it("skips mailto links", () => {
      expect(extractHtmlLinks(`<a href="mailto:a@b.com">M</a>`)).toEqual([]);
    });

    it("skips javascript: links", () => {
      expect(
        extractHtmlLinks(`<a href="javascript:void(0)">J</a>`),
      ).toEqual([]);
    });

    it("reports correct line numbers", () => {
      const html = [
        "<html>",
        "<body>",
        '<a href="/page1">P1</a>',
        '<a href="/page2">P2</a>',
        "</body>",
      ].join("\n");
      expect(extractHtmlLinks(html)).toEqual([
        { href: "/page1", line: 3 },
        { href: "/page2", line: 4 },
      ]);
    });

    it("handles links with other attributes", () => {
      const html = `<a class="link" href="/foo" data-x="1">F</a>`;
      expect(extractHtmlLinks(html)).toEqual([{ href: "/foo", line: 1 }]);
    });

    it("finds multiple links in same line", () => {
      const html = `<a href="/a">A</a><a href="/b">B</a>`;
      expect(extractHtmlLinks(html)).toEqual([
        { href: "/a", line: 1 },
        { href: "/b", line: 1 },
      ]);
    });

    it("skips data: URIs", () => {
      expect(
        extractHtmlLinks(`<a href="data:text/html,<h1>Hi</h1>">D</a>`),
      ).toEqual([]);
    });

    it("skips tel: URIs", () => {
      expect(extractHtmlLinks(`<a href="tel:+1234567890">Call</a>`)).toEqual(
        [],
      );
    });

    it("extracts single-quoted href attributes", () => {
      const html = `<a href='/foo'>F</a>`;
      expect(extractHtmlLinks(html)).toEqual([{ href: "/foo", line: 1 }]);
    });

    it("handles mixed single and double quoted hrefs", () => {
      const html = `<a href="/a">A</a>\n<a href='/b'>B</a>`;
      expect(extractHtmlLinks(html)).toEqual([
        { href: "/a", line: 1 },
        { href: "/b", line: 2 },
      ]);
    });
  });

  // --- resolveLink ---

  describe("resolveLink", () => {
    const BASE = "/pj/zudo-doc/";

    it("strips base path and resolves directory with index.html", async () => {
      mkdirSync(join(tmpDir, "docs", "foo"), { recursive: true });
      writeFileSync(join(tmpDir, "docs", "foo", "index.html"), "");
      expect(await resolveLink("/pj/zudo-doc/docs/foo", tmpDir, BASE)).toBe(
        true,
      );
    });

    it("resolves path with trailing slash", async () => {
      mkdirSync(join(tmpDir, "docs", "foo"), { recursive: true });
      writeFileSync(join(tmpDir, "docs", "foo", "index.html"), "");
      expect(await resolveLink("/pj/zudo-doc/docs/foo/", tmpDir, BASE)).toBe(
        true,
      );
    });

    it("resolves path to .html file", async () => {
      mkdirSync(join(tmpDir, "docs"), { recursive: true });
      writeFileSync(join(tmpDir, "docs", "foo.html"), "");
      expect(await resolveLink("/pj/zudo-doc/docs/foo", tmpDir, BASE)).toBe(
        true,
      );
    });

    it("resolves file link with extension", async () => {
      mkdirSync(join(tmpDir, "_astro"), { recursive: true });
      writeFileSync(join(tmpDir, "_astro", "style.css"), "");
      expect(
        await resolveLink("/pj/zudo-doc/_astro/style.css", tmpDir, BASE),
      ).toBe(true);
    });

    it("returns false for missing target", async () => {
      expect(
        await resolveLink("/pj/zudo-doc/docs/nope", tmpDir, BASE),
      ).toBe(false);
    });

    it("strips query string before checking", async () => {
      mkdirSync(join(tmpDir, "docs", "foo"), { recursive: true });
      writeFileSync(join(tmpDir, "docs", "foo", "index.html"), "");
      expect(
        await resolveLink("/pj/zudo-doc/docs/foo?q=1", tmpDir, BASE),
      ).toBe(true);
    });

    it("strips both query string and fragment before checking", async () => {
      mkdirSync(join(tmpDir, "docs", "foo"), { recursive: true });
      writeFileSync(join(tmpDir, "docs", "foo", "index.html"), "");
      expect(
        await resolveLink("/pj/zudo-doc/docs/foo?q=1#section", tmpDir, BASE),
      ).toBe(true);
    });

    it("strips fragment before checking", async () => {
      mkdirSync(join(tmpDir, "docs", "foo"), { recursive: true });
      writeFileSync(join(tmpDir, "docs", "foo", "index.html"), "");
      expect(
        await resolveLink("/pj/zudo-doc/docs/foo#section", tmpDir, BASE),
      ).toBe(true);
    });

    it("returns true for empty href after fragment strip", async () => {
      expect(await resolveLink("", tmpDir, BASE)).toBe(true);
    });

    it("returns true for base path root", async () => {
      // /pj/zudo-doc/ → stripped to / → relPath is empty → true
      expect(await resolveLink("/pj/zudo-doc/", tmpDir, BASE)).toBe(true);
    });

    it("works without base path (default /)", async () => {
      mkdirSync(join(tmpDir, "docs", "foo"), { recursive: true });
      writeFileSync(join(tmpDir, "docs", "foo", "index.html"), "");
      expect(await resolveLink("/docs/foo", tmpDir)).toBe(true);
    });

    it("resolves relative links against file directory", async () => {
      const fileDir = join(tmpDir, "docs", "skills", "example");
      mkdirSync(fileDir, { recursive: true });
      mkdirSync(join(tmpDir, "docs", "skills", "example", "sub"), {
        recursive: true,
      });
      writeFileSync(
        join(tmpDir, "docs", "skills", "example", "sub", "index.html"),
        "",
      );
      expect(
        await resolveLink("./sub", tmpDir, "/", fileDir),
      ).toBe(true);
    });

    it("returns false for missing relative link target", async () => {
      const fileDir = join(tmpDir, "docs", "skills");
      mkdirSync(fileDir, { recursive: true });
      expect(
        await resolveLink("./nope", tmpDir, "/", fileDir),
      ).toBe(false);
    });
  });

  // --- extractMdxAbsoluteLinks ---

  describe("extractMdxAbsoluteLinks", () => {
    it("finds markdown links starting with /docs/", () => {
      const content = `See [guide](/docs/guides/foo) for details.`;
      expect(extractMdxAbsoluteLinks(content)).toEqual([
        { href: "/docs/guides/foo", line: 1 },
      ]);
    });

    it("finds markdown links starting with /ja/docs/", () => {
      const content = `See [guide](/ja/docs/guides/foo) for details.`;
      expect(extractMdxAbsoluteLinks(content)).toEqual([
        { href: "/ja/docs/guides/foo", line: 1 },
      ]);
    });

    it("finds JSX href with /docs/", () => {
      const content = `<a href="/docs/guides/foo">link</a>`;
      expect(extractMdxAbsoluteLinks(content)).toEqual([
        { href: "/docs/guides/foo", line: 1 },
      ]);
    });

    it("finds JSX href with /ja/docs/", () => {
      const content = `<a href="/ja/docs/guides/foo">link</a>`;
      expect(extractMdxAbsoluteLinks(content)).toEqual([
        { href: "/ja/docs/guides/foo", line: 1 },
      ]);
    });

    it("ignores links that include base path", () => {
      const content = `[link](/pj/zudo-doc/docs/guides/foo)`;
      expect(extractMdxAbsoluteLinks(content)).toEqual([]);
    });

    it("reports correct line numbers", () => {
      const content = [
        "line 1",
        "line 2",
        "[link](/docs/foo)",
        "line 4",
        "[link2](/docs/bar)",
      ].join("\n");
      expect(extractMdxAbsoluteLinks(content)).toEqual([
        { href: "/docs/foo", line: 3 },
        { href: "/docs/bar", line: 5 },
      ]);
    });

    it("finds multiple links on same line", () => {
      const content = `[a](/docs/foo) and [b](/docs/bar)`;
      expect(extractMdxAbsoluteLinks(content)).toEqual([
        { href: "/docs/foo", line: 1 },
        { href: "/docs/bar", line: 1 },
      ]);
    });

    it("does not match partial paths like /documentary/", () => {
      const content = `[link](/documentary/something)`;
      expect(extractMdxAbsoluteLinks(content)).toEqual([]);
    });

    it("skips links inside fenced code blocks", () => {
      const content = [
        "[before](/docs/visible)",
        "```js",
        "[inside](/docs/hidden)",
        "```",
        "[after](/docs/also-visible)",
      ].join("\n");
      const result = extractMdxAbsoluteLinks(content);
      expect(result).toEqual([
        { href: "/docs/visible", line: 1 },
        { href: "/docs/also-visible", line: 5 },
      ]);
    });

    it("skips links inside multiple code blocks", () => {
      const content = [
        "```",
        "[a](/docs/hidden1)",
        "```",
        "[b](/docs/visible)",
        "```tsx",
        '[c](/docs/hidden2)',
        "```",
      ].join("\n");
      const result = extractMdxAbsoluteLinks(content);
      expect(result).toEqual([{ href: "/docs/visible", line: 4 }]);
    });
  });

  // --- checkHtmlLinks (integration) ---

  describe("checkHtmlLinks", () => {
    const BASE = "/pj/zudo-doc/";

    it("detects broken internal links with base path stripping", async () => {
      const distDir = join(tmpDir, "dist");
      mkdirSync(join(distDir, "docs", "page1"), { recursive: true });
      writeFileSync(
        join(distDir, "docs", "page1", "index.html"),
        `<a href="/pj/zudo-doc/docs/missing">Missing</a>`,
      );

      const broken = await checkHtmlLinks(distDir, tmpDir, BASE);
      expect(broken).toEqual([
        {
          file: "dist/docs/page1/index.html",
          line: 1,
          href: "/pj/zudo-doc/docs/missing",
        },
      ]);
    });

    it("passes when all links resolve", async () => {
      const distDir = join(tmpDir, "dist");
      mkdirSync(join(distDir, "docs", "a"), { recursive: true });
      mkdirSync(join(distDir, "docs", "b"), { recursive: true });
      writeFileSync(
        join(distDir, "docs", "a", "index.html"),
        `<a href="/pj/zudo-doc/docs/b">B</a>`,
      );
      writeFileSync(join(distDir, "docs", "b", "index.html"), "<p>B</p>");

      const broken = await checkHtmlLinks(distDir, tmpDir, BASE);
      expect(broken).toEqual([]);
    });
  });

  // --- checkMdxLinks (integration) ---

  describe("checkMdxLinks", () => {
    it("detects absolute /docs/ links in MDX files", async () => {
      const docsDir = join(tmpDir, "src", "content", "docs");
      mkdirSync(join(docsDir, "guides"), { recursive: true });
      writeFileSync(
        join(docsDir, "guides", "test.mdx"),
        "---\ntitle: Test\n---\n\nSee [foo](/docs/guides/foo) for details.",
      );

      const warnings = await checkMdxLinks([docsDir], tmpDir);
      expect(warnings).toEqual([
        {
          file: "src/content/docs/guides/test.mdx",
          line: 5,
          href: "/docs/guides/foo",
        },
      ]);
    });

    it("handles .md files too", async () => {
      const docsDir = join(tmpDir, "docs");
      mkdirSync(docsDir, { recursive: true });
      writeFileSync(
        join(docsDir, "readme.md"),
        "[link](/docs/ref)",
      );

      const warnings = await checkMdxLinks([docsDir], tmpDir);
      expect(warnings).toHaveLength(1);
      expect(warnings[0].href).toBe("/docs/ref");
    });

    it("skips non-existent directories", async () => {
      const warnings = await checkMdxLinks(
        [join(tmpDir, "nonexistent")],
        tmpDir,
      );
      expect(warnings).toEqual([]);
    });
  });

  // --- formatReport ---

  describe("formatReport", () => {
    it("formats report with both broken links and warnings", () => {
      const report = formatReport(
        [{ file: "dist/page.html", line: 10, href: "/broken" }],
        [{ file: "src/content/docs/test.mdx", line: 5, href: "/docs/foo" }],
      );
      expect(report).toContain("=== Broken Links in Built HTML ===");
      expect(report).toContain("dist/page.html:10  /broken");
      expect(report).toContain(
        "=== Absolute Links Bypassing Base Path (MDX Source) ===",
      );
      expect(report).toContain("src/content/docs/test.mdx:5  /docs/foo");
      expect(report).toContain(
        "✗ Found 1 broken link and 1 absolute path warning",
      );
    });

    it("shows success message when no issues", () => {
      const report = formatReport([], []);
      expect(report).toContain(
        "✓ No broken links or absolute path issues found",
      );
    });

    it("pluralizes broken links correctly", () => {
      const report = formatReport(
        [
          { file: "a.html", line: 1, href: "/a" },
          { file: "b.html", line: 2, href: "/b" },
        ],
        [],
      );
      expect(report).toContain("✗ Found 2 broken links");
    });

    it("formats only warnings when no broken links", () => {
      const report = formatReport(
        [],
        [{ file: "test.mdx", line: 1, href: "/docs/x" }],
      );
      expect(report).not.toContain("=== Broken Links");
      expect(report).toContain("=== Absolute Links");
      expect(report).toContain("✗ Found 1 absolute path warning");
    });

    it("formats only broken links when no warnings", () => {
      const report = formatReport(
        [{ file: "a.html", line: 1, href: "/a" }],
        [],
      );
      expect(report).toContain("=== Broken Links");
      expect(report).not.toContain("=== Absolute Links");
      expect(report).toContain("✗ Found 1 broken link");
    });
  });
});
