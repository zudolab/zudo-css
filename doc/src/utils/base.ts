import { settings } from "@/config/settings";
import { defaultLocale, type Locale } from "@/config/i18n";

/** Normalized base path with no trailing slash (empty string when "/"). */
export const normalizedBase = settings.base.replace(/\/+$/, "");

/** Prefix a path with the configured base directory. */
export function withBase(path: string): string {
  if (normalizedBase === "") return path;
  return `${normalizedBase}${path.startsWith("/") ? path : `/${path}`}`;
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
