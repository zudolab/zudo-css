import { readdirSync } from "node:fs";
import { resolve } from "node:path";

export interface DocsSourceMapOptions {
  /** Absolute root directory of the project */
  rootDir: string;
  /** Main docs directory relative to rootDir (e.g., "src/content/docs") */
  docsDir: string;
  /** Locale configurations: { ja: { dir: "src/content/docs-ja" } } */
  locales: Record<string, { dir: string }>;
  /** Version configurations */
  versions: Array<{ slug: string; docsDir: string }> | false;
  /** Base URL path (e.g., "/" or "/pj/my-docs/") */
  base: string;
  /** Whether to append trailing slash to URLs */
  trailingSlash: boolean;
}

/**
 * Build a map of absolute file paths to URL paths.
 * Scans all configured docs directories for .md/.mdx files.
 */
export function buildDocsSourceMap(
  options: DocsSourceMapOptions,
): Map<string, string> {
  const map = new Map<string, string>();
  const { rootDir, docsDir, locales, versions, base, trailingSlash } = options;

  const normalizedBase = base.replace(/\/+$/, "");

  function applyTS(url: string): string {
    if (trailingSlash) {
      if (url.endsWith("/")) return url;
      return url + "/";
    }
    // Strip trailing slashes when trailingSlash is false (except root "/")
    if (url !== "/" && url.endsWith("/")) {
      return url.replace(/\/+$/, "");
    }
    return url;
  }

  function withBase(path: string): string {
    const raw =
      normalizedBase === ""
        ? path
        : `${normalizedBase}${path.startsWith("/") ? path : `/${path}`}`;
    return applyTS(raw);
  }

  function scanDir(dir: string, urlPrefix: string): void {
    const absDir = resolve(rootDir, dir);
    let files: string[];
    try {
      files = readdirSync(absDir, { recursive: true })
        .map((f) => String(f))
        .filter((f) => /\.(md|mdx)$/.test(f));
    } catch {
      // Directory doesn't exist — skip silently
      return;
    }
    for (const file of files) {
      const absFile = resolve(absDir, file);
      // Convert file path to slug: strip extension, strip /index suffix
      const slug = file
        .replace(/\.(md|mdx)$/, "")
        .replace(/(^|\/)index$/, "$1") // Strip index (root or nested)
        .replace(/(^|\\)index$/, "$1") // Windows
        .replace(/\\/g, "/") // Windows path sep
        .replace(/\/$/, ""); // Trailing slash from index strip
      const url = withBase(`${urlPrefix}/${slug}`);
      map.set(absFile, url);

      // Also register with alternative extension for cross-referencing
      // e.g., if file is foo.mdx, also register foo.md → same URL
      // Only set if not already registered (avoid shadowing a real file)
      const altExt = file.endsWith(".mdx")
        ? file.replace(/\.mdx$/, ".md")
        : file.replace(/\.md$/, ".mdx");
      const altFile = resolve(absDir, altExt);
      if (!map.has(altFile)) {
        map.set(altFile, url);
      }
    }
  }

  // Main docs (default locale)
  scanDir(docsDir, "/docs");

  // Locale docs
  for (const [code, config] of Object.entries(locales)) {
    scanDir(config.dir, `/${code}/docs`);
  }

  // Versioned docs
  if (versions) {
    for (const version of versions) {
      scanDir(version.docsDir, `/v/${version.slug}/docs`);
    }
  }

  return map;
}
