import type { ComponentType } from "preact/compat";
import type { Locale } from "@/config/i18n";

/**
 * Props passed to every custom frontmatter renderer component.
 *
 * Lookup rule: `frontmatterRenderers[key]` is checked after the ignore-list
 * filter and after null/undefined skipping, so renderers only receive defined
 * values and are never invoked for ignored keys.
 *
 * Ignore-list precedence: if a key appears in `settings.frontmatterPreview.ignoreKeys`
 * (or the default ignore list), the row is suppressed entirely — even if a renderer
 * is registered for that key. To reveal a framework-managed key with a custom
 * renderer, first remove the key from the ignore list in settings.
 *
 * Fallback behavior: if no renderer is registered for a key, the built-in
 * `renderValue()` path is used (string/number/boolean as text, other types as
 * JSON in a `<code>` element).
 *
 * Null/undefined skipping: values of `null` or `undefined` are filtered out
 * before renderer lookup. Renderers can assume `value` is defined.
 */
export interface FrontmatterRendererProps {
  value: NonNullable<unknown>;
  entryKey: string;
  data: Record<string, unknown>;
  locale?: Locale;
}

/**
 * Per-key custom renderer map for the frontmatter-preview component.
 *
 * Add entries here to override how specific frontmatter fields are displayed.
 * Keys must match frontmatter field names exactly (case-sensitive).
 *
 * Example (add a renderer for a `status` field):
 * ```tsx
 * status: ({ value }) => <strong>{String(value)}</strong>,
 * ```
 */
export const frontmatterRenderers: Record<
  string,
  ComponentType<FrontmatterRendererProps>
> = {};
