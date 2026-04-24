/**
 * Tag governance enforcement level.
 *
 * - `"off"`   — no vocabulary-aware enforcement. The `tags` schema stays a
 *               free-form `string[]`. Identical to pre-vocabulary behaviour.
 * - `"warn"`  — `tags` schema stays free-form so builds pass, but the tag
 *               audit script (see Sub 2) reports unknown tags as warnings and
 *               exits non-zero under `--ci`.
 * - `"strict"` — `tags` schema is tightened to `z.enum([...allowedIds])`, so
 *                unknown tags fail `pnpm check` / `pnpm build`.
 *
 * Orthogonal to `tagVocabulary` (the on/off switch for consulting the
 * vocabulary file at runtime). See `settings-types.ts` for details.
 */
export type TagGovernanceMode = "off" | "warn" | "strict";

/**
 * A single entry in the tag vocabulary.
 *
 * - `id`         — canonical tag id. What content files should ideally use.
 * - `label`      — optional human-readable label (falls back to `id`).
 * - `description`— optional short description for tooling / tag index pages.
 * - `group`      — optional grouping key used by the grouped tag footer
 *                  (e.g. `"type"`, `"level"`, `"topic"`).
 * - `aliases`    — alternate strings that content files may use. Alias
 *                  resolution rewrites these to `id` before aggregation.
 * - `deprecated` — `true` marks the tag as deprecated with no redirect: the
 *                  canonical id is dropped from aggregation. Pass
 *                  `{ redirect: "<other-id>" }` to rewrite this tag to another
 *                  canonical id when it appears in content.
 */
export interface TagVocabularyEntry {
  id: string;
  label?: string;
  description?: string;
  group?: string;
  aliases?: readonly string[];
  deprecated?: boolean | { redirect?: string };
}
