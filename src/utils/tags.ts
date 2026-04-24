import type { DocsEntry } from "@/types/docs-entry";
import { settings } from "@/config/settings";
import { tagVocabulary } from "@/config/tag-vocabulary";
import type { TagVocabularyEntry } from "@/config/tag-vocabulary-types";

export interface TagInfo {
  tag: string;
  count: number;
  docs: { slug: string; title: string; description?: string }[];
}

export interface ResolvedTag {
  /** Canonical id after alias/redirect rewrites. Equal to the raw input when unchanged. */
  canonical: string;
  /** True when the canonical id should be dropped from aggregation (deprecated without redirect). */
  deprecated: boolean;
  /** True when the raw input matched a vocabulary entry (as id or alias). */
  known: boolean;
}

interface VocabularyIndex {
  byId: Map<string, TagVocabularyEntry>;
  byAlias: Map<string, TagVocabularyEntry>;
}

let cachedIndex: VocabularyIndex | null = null;
function getIndex(): VocabularyIndex {
  if (cachedIndex) return cachedIndex;
  const byId = new Map<string, TagVocabularyEntry>();
  const byAlias = new Map<string, TagVocabularyEntry>();
  for (const entry of tagVocabulary) {
    byId.set(entry.id, entry);
    for (const alias of entry.aliases ?? []) byAlias.set(alias, entry);
  }
  cachedIndex = { byId, byAlias };
  return cachedIndex;
}

function vocabularyActive(): boolean {
  return Boolean(settings.tagVocabulary) && settings.tagGovernance !== "off";
}

/**
 * Resolve a raw tag string to its canonical form.
 *
 * When the vocabulary is inactive (`tagVocabulary: false` or
 * `tagGovernance: "off"`), the raw value passes through unchanged with
 * `known: false, deprecated: false`. Otherwise:
 *
 * - A direct id match returns that id.
 * - An alias match returns the aliased entry's id.
 * - `deprecated: { redirect: "<id>" }` rewrites to the redirect target.
 * - `deprecated: true` (no redirect) returns `deprecated: true` so callers
 *   can drop the tag from aggregation.
 * - An unknown value returns the raw string with `known: false`.
 */
export function resolveTag(raw: string): ResolvedTag {
  if (!vocabularyActive()) {
    return { canonical: raw, deprecated: false, known: false };
  }
  const { byId, byAlias } = getIndex();
  const entry = byId.get(raw) ?? byAlias.get(raw);
  if (!entry) return { canonical: raw, deprecated: false, known: false };
  const dep = entry.deprecated;
  if (dep && typeof dep === "object" && dep.redirect) {
    const target = byId.get(dep.redirect);
    if (target) return { canonical: target.id, deprecated: false, known: true };
    // Redirect points at a missing id — treat like plain deprecation.
    return { canonical: entry.id, deprecated: true, known: true };
  }
  if (dep === true) {
    return { canonical: entry.id, deprecated: true, known: true };
  }
  return { canonical: entry.id, deprecated: false, known: true };
}

/**
 * Resolve a list of raw tag strings (e.g. from frontmatter) to canonical ids,
 * dropping deprecated-without-redirect entries and preserving order. Duplicates
 * produced by alias collapse are removed.
 */
export function resolvePageTags(rawTags: readonly string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of rawTags) {
    const { canonical, deprecated } = resolveTag(raw);
    if (deprecated) continue;
    if (seen.has(canonical)) continue;
    seen.add(canonical);
    out.push(canonical);
  }
  return out;
}

export function collectTags(
  entries: DocsEntry[],
  slugFn: (id: string, data: { slug?: string }) => string,
): Map<string, TagInfo> {
  const tagMap = new Map<string, TagInfo>();

  for (const entry of entries) {
    const rawTags = entry.data.tags ?? [];
    const slug = slugFn(entry.id, entry.data);

    const seen = new Set<string>();
    for (const raw of rawTags) {
      const resolved = resolveTag(raw);
      if (resolved.deprecated) continue;
      if (seen.has(resolved.canonical)) continue;
      seen.add(resolved.canonical);

      if (!tagMap.has(resolved.canonical)) {
        tagMap.set(resolved.canonical, { tag: resolved.canonical, count: 0, docs: [] });
      }
      const info = tagMap.get(resolved.canonical)!;
      info.count++;
      info.docs.push({
        slug,
        title: entry.data.title,
        description: entry.data.description,
      });
    }
  }

  return tagMap;
}
