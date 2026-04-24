import { SmartBreak as SmartBreakImpl } from '@/utils/smart-break';

// Preact VNode vs React.ReactNode type mismatch under compat mode; cast so the
// content override type-checks. Runtime is fine since @astrojs/preact compat is on.
const SmartBreak = SmartBreakImpl as unknown as (props: {
  children?: unknown;
}) => any;

type Props = {
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
};

/**
 * Override for inline `<code>` in MDX. Wraps text-only inline code with
 * <SmartBreak> so that path/URL-like strings (e.g. `src/foo/bar.ts`) can
 * break at delimiters on narrow viewports.
 *
 * Block code inside a fenced block is processed by Shiki, which emits a
 * <code> element with class "language-*" containing a tree of <span>
 * nodes (not a plain string). We detect those and render untouched so
 * syntax highlighting is never disturbed.
 *
 * Astro 6 passes pure-text MDX children wrapped in a `StaticHtml` Preact
 * component whose text lives in `props.value`, not as a string child.
 * `extractText` unwraps that so the heuristic works regardless of MDX's
 * internal wrapping.
 */
export function ContentCode({ children, className, ...rest }: Props) {
  const isShikiBlock =
    typeof className === 'string' && /(^|\s)language-/.test(className);

  const textFromChildren = isShikiBlock ? null : extractText(children);

  if (textFromChildren === null) {
    return (
      <code className={className} {...rest}>
        {children}
      </code>
    );
  }

  return (
    <code className={className} {...rest}>
      <SmartBreak>{textFromChildren}</SmartBreak>
    </code>
  );
}

/**
 * Walk a React/Preact children value and return a concatenated plain
 * string when the entire subtree is text-only. Returns null if any
 * non-text node (other than the StaticHtml wrapper Astro uses for pure
 * text MDX content) is found — that signals inline markup inside the
 * code span and means we must not inject <wbr>.
 */
function extractText(children: unknown): string | null {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  // Only accept a single VNode whose `props.value` is text (the Astro
  // StaticHtml wrapper used for pure-text MDX children). Deliberately do
  // NOT recurse into arbitrary VNode trees — that would match Shiki's
  // <span>-based block code output and inject <wbr> into syntax-highlighted
  // tokens, breaking block code rendering.
  if (children && typeof children === 'object' && !Array.isArray(children)) {
    const v = children as { props?: { value?: unknown } };
    if (v.props && v.props.value != null) {
      if (
        typeof v.props.value === 'string' ||
        v.props.value instanceof String ||
        (typeof v.props.value === 'object' && typeof (v.props.value as object).toString === 'function')
      ) {
        const s = String(v.props.value);
        if (!s || s.startsWith('[object')) return null;
        // Shiki block-code output also arrives as a StaticHtml wrapper, but
        // its value is escaped HTML (e.g. "&lt;span class=...&gt;"). Inline
        // code's value is the plain text of the backtick span (no HTML
        // markup). If the value looks like HTML, refuse to unwrap — the
        // block path below falls through to a plain <code> passthrough.
        if (looksLikeHtmlMarkup(s)) return null;
        return decodeEntities(s);
      }
    }
  }
  return null;
}

/**
 * Detect whether a string is the HTML-escaped rendering of a Shiki block
 * (with nested <span> tokens) rather than the plain text of an inline
 * `<code>` span. The presence of an escaped HTML-tag opener (`&lt;span`,
 * `&lt;code`, etc.) is a reliable signal; plain URL/path inline code
 * never contains those escaped sequences.
 */
function looksLikeHtmlMarkup(s: string): boolean {
  return /&lt;(span|code|pre|div|br|i|b|em|strong)\b/i.test(s) || /<(span|code|pre)\s/i.test(s);
}

/**
 * Minimal HTML entity decoder for the set MDX produces for inline text
 * (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`, numeric). Keeps the
 * result visually identical to the authored source so downstream
 * SmartBreak operates on the original characters.
 */
function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&');
}
