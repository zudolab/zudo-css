import type { AstroIntegration } from "astro";
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { settings } from "../config/settings";

/** Maximum body text stored per entry (for display excerpts) */
const MAX_BODY_LENGTH = 300;

/** A single document entry in the search index */
export interface SearchIndexEntry {
  id: string;
  title: string;
  body: string;
  url: string;
  description: string;
}

/** Strip markdown formatting to produce plain text for indexing */
function stripMarkdown(md: string): string {
  return (
    md
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`[^`]+`/g, "")
      // Remove HTML tags
      .replace(/<[^>]+>/g, "")
      // Remove headings markers
      .replace(/^#{1,6}\s+/gm, "")
      // Remove emphasis/bold markers
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
      .replace(/_{1,3}([^_]+)_{1,3}/g, "$1")
      // Remove images (must run before link removal)
      .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
      // Remove links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Remove blockquote markers
      .replace(/^>\s+/gm, "")
      // Remove horizontal rules
      .replace(/^[-*_]{3,}\s*$/gm, "")
      // Remove list markers
      .replace(/^[\s]*[-*+]\s+/gm, "")
      .replace(/^[\s]*\d+\.\s+/gm, "")
      // Remove import statements
      .replace(/^import\s+.*$/gm, "")
      // Remove export statements
      .replace(/^export\s+.*$/gm, "")
      // Collapse whitespace
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

/** Truncate text to max length for the search index */
function truncateBody(text: string): string {
  return text.length > MAX_BODY_LENGTH
    ? text.substring(0, MAX_BODY_LENGTH)
    : text;
}

/** Compute a URL from a slug and locale */
function slugToUrl(slug: string, locale: string | null): string {
  const base = settings.base.replace(/\/$/, "");
  if (locale) {
    return `${base}/${locale}/docs/${slug}`;
  }
  return `${base}/docs/${slug}`;
}

/** Walk a directory and collect all .md/.mdx files */
function collectMdFiles(
  dir: string,
): Array<{ filePath: string; slug: string }> {
  const results: Array<{ filePath: string; slug: string }> = [];

  function walk(currentDir: string, baseDir: string): void {
    let entries;
    try {
      entries = readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, baseDir);
      } else if (/\.mdx?$/.test(entry.name) && !entry.name.startsWith("_")) {
        const rel = fullPath
          .slice(baseDir.length + 1)
          .replace(/\.mdx?$/, "")
          .replace(/\/index$/, "");
        results.push({ filePath: fullPath, slug: rel });
      }
    }
  }

  walk(dir, dir);
  return results;
}

/** Build search index entries for a content directory */
function buildEntries(
  contentDir: string,
  locale: string | null,
): SearchIndexEntry[] {
  const absDir = resolve(contentDir);
  const files = collectMdFiles(absDir);
  const entries: SearchIndexEntry[] = [];

  for (const { filePath, slug } of files) {
    try {
      const raw = readFileSync(filePath, "utf-8");
      const { data, content } = matter(raw);

      // Skip excluded/draft/unlisted pages
      if (data.search_exclude || data.draft || data.unlisted) continue;

      const id = locale ? `${locale}/${slug}` : slug;
      entries.push({
        id,
        title: data.title ?? slug,
        body: truncateBody(stripMarkdown(content)),
        url: slugToUrl(slug, locale),
        description: data.description ?? "",
      });
    } catch {
      // Skip files that can't be parsed
    }
  }

  return entries;
}

/** Collect all search index entries from all configured content directories */
export function collectSearchEntries(): SearchIndexEntry[] {
  const entries: SearchIndexEntry[] = [];

  // Default locale docs
  entries.push(...buildEntries(settings.docsDir, null));

  // Locale docs
  if (settings.locales) {
    for (const [code, config] of Object.entries(settings.locales)) {
      entries.push(...buildEntries(config.dir, code));
    }
  }

  return entries;
}

export function searchIndexIntegration(): AstroIntegration {
  return {
    name: "search-index",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const outDir = fileURLToPath(dir);
        const entries = collectSearchEntries();
        const jsonPath = join(outDir, "search-index.json");
        mkdirSync(outDir, { recursive: true });
        writeFileSync(jsonPath, JSON.stringify(entries));
        logger.info(
          `Generated search index with ${entries.length} entries`,
        );
      },

      "astro:config:setup": ({ updateConfig, command }) => {
        if (command !== "dev") return;

        updateConfig({
          vite: {
            plugins: [
              {
                name: "search-index-dev",
                configureServer(server) {
                  server.middlewares.use((req, res, next) => {
                    const match =
                      req.url === "/search-index.json" ||
                      req.url?.endsWith("/search-index.json");
                    if (!match) {
                      next();
                      return;
                    }

                    try {
                      const entries = collectSearchEntries();
                      res.setHeader("Content-Type", "application/json");
                      res.end(JSON.stringify(entries));
                    } catch (err) {
                      res.statusCode = 500;
                      res.setHeader("Content-Type", "application/json");
                      res.end(
                        JSON.stringify({
                          error:
                            err instanceof Error
                              ? err.message
                              : "Internal error",
                        }),
                      );
                    }
                  });
                },
              },
            ],
          },
        });
      },
    },
  };
}
