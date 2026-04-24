import { settings } from "@/config/settings";
import { defaultLocale, locales, getLocaleLabel, type Locale } from "@/config/i18n";
import type { LocaleLink } from "@/types/locale";

/** Normalized base path with no trailing slash (empty string when "/"). */
export const normalizedBase = settings.base.replace(/\/+$/, "");

/**
 * Append a trailing slash to page URLs when `settings.trailingSlash` is true.
 * Skips paths that already end with `/`, contain a file extension, or have a
 * query string / fragment before the slash would be inserted.
 */
export function applyTrailingSlash(url: string): string {
  if (!settings.trailingSlash) return url;
  if (url.endsWith("/")) return url;
  // Split off query string and fragment
  const suffixIdx = url.search(/[?#]/);
  const pathPart = suffixIdx >= 0 ? url.slice(0, suffixIdx) : url;
  const suffix = suffixIdx >= 0 ? url.slice(suffixIdx) : "";
  if (pathPart.endsWith("/")) return url;
  // Check file extension on the last path segment only, requiring the extension
  // to start with a letter to avoid false positives on version-like paths (e.g. /docs/v2.0)
  const lastSegment = pathPart.split("/").pop() ?? "";
  if (/\.[a-zA-Z]\w*$/.test(lastSegment)) return url;
  return pathPart + "/" + suffix;
}

/** Prefix a path with the configured base directory. */
export function withBase(path: string): string {
  const raw =
    normalizedBase === ""
      ? path
      : `${normalizedBase}${path.startsWith("/") ? path : `/${path}`}`;
  return applyTrailingSlash(raw);
}

/** Strip the base prefix from a URL pathname. */
export function stripBase(path: string): string {
  if (normalizedBase === "") return path;
  return path.startsWith(normalizedBase)
    ? path.slice(normalizedBase.length) || "/"
    : path;
}

/** Build a docs URL for the given slug and lang. */
export function docsUrl(slug: string, lang: Locale = defaultLocale): string {
  const path = lang === defaultLocale ? `/docs/${slug}` : `/${lang}/docs/${slug}`;
  return withBase(path);
}

/** Check if a URL is external (starts with http:// or https://). */
export function isExternal(href: string): boolean {
  return href.startsWith("http://") || href.startsWith("https://");
}

/** Resolve a href: external URLs pass through, internal ones get the base prefix. */
export function resolveHref(href: string): string {
  return isExternal(href) ? href : withBase(href);
}

/**
 * Build a localized, versioned nav href.
 * Note: uses /{lang}/v/{version}/... ordering (for header/sidebar nav links).
 * This differs from versionedDocsUrl() which uses /v/{version}/{lang}/... (for doc page links).
 * Both orderings are handled by the routing layer.
 */
export function navHref(
  path: string,
  lang: Locale | undefined,
  currentVersion: string | undefined,
): string {
  const isNonDefaultLocale = lang != null && lang !== defaultLocale;
  const versionPrefix = currentVersion ? `/v/${currentVersion}` : "";
  return withBase(
    isNonDefaultLocale
      ? `/${lang}${versionPrefix}${path}`
      : `${versionPrefix}${path}`,
  );
}

/** Build a locale-switched path from the current page path. */
export function getPathForLocale(
  path: string,
  currentLang: Locale,
  targetLang: Locale,
): string {
  let relativePath = stripBase(path);
  if (currentLang !== defaultLocale) {
    relativePath = relativePath.replace(new RegExp(`^/${currentLang}/`), "/");
  }
  if (targetLang !== defaultLocale) {
    relativePath = `/${targetLang}${relativePath}`;
  }
  return withBase(relativePath);
}

/** Build locale links for locale switcher UI components. */
export function buildLocaleLinks(currentPath: string, currentLang: Locale): LocaleLink[] {
  return locales.map((code) => ({
    code,
    label: getLocaleLabel(code),
    href: getPathForLocale(currentPath, currentLang, code),
    active: code === currentLang,
  }));
}

/** Build a versioned docs URL for the given slug, version, and lang. */
export function versionedDocsUrl(slug: string, versionSlug: string, lang: Locale = defaultLocale): string {
  const path = lang === defaultLocale
    ? `/v/${versionSlug}/docs/${slug}`
    : `/v/${versionSlug}/${lang}/docs/${slug}`;
  return withBase(path);
}
