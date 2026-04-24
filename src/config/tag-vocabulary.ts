import type { TagVocabularyEntry } from "./tag-vocabulary-types";

/**
 * Canonical tag vocabulary for this documentation base.
 *
 * Populate this array with the tags you use in `src/content/docs/**`.
 * Then enable `tagGovernance: "warn"` (or `"strict"`) and
 * `tagVocabulary: true` in `settings.ts` to activate alias resolution,
 * deprecation filtering, and grouped tag rendering.
 *
 * Example entry:
 *
 *     {
 *       id: "type:guide",
 *       label: "Guide",
 *       group: "type",
 *       aliases: ["guide", "guides"],
 *     }
 */
export const tagVocabulary: readonly TagVocabularyEntry[] = [];
