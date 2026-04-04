# zcss — zudo-css

Documentation site teaching CSS best practices, built with Astro 5, MDX, Tailwind CSS v4, and React islands (zudo-doc framework).

## Project Structure

```
src/content/docs/       # MDX articles by category (English)
src/content/docs-ja/    # Japanese locale articles
src/components/         # CssPreview, PreviewBase, TailwindPreview, etc.
src/config/             # Settings, color schemes, sidebars, i18n
src/layouts/            # Astro layouts
src/pages/              # Astro page routes
src/plugins/            # Rehype plugins
src/integrations/       # Astro integrations (search, doc-history, sitemap)
src/styles/             # Global CSS (Tailwind v4 + design tokens)
src/utils/              # Utility functions
public/                 # Static assets
lefthook.yml            # Git hooks (pre-commit: format, pre-push: quality checks)
.claude/skills/         # Claude Code skills managed in this repo
```

## Development

Package manager: **pnpm** (Node.js >= 20).

```bash
pnpm install && pnpm dev     # Dev server → http://css-bp.localhost:8811
pnpm build                   # Production build → dist/
pnpm preview                 # Preview build
pnpm check                   # Astro type checking
```

## Tech Stack

- **Astro 5** — static site generator with Content Collections
- **MDX** — via `@astrojs/mdx`, content in `src/content/docs/`
- **Tailwind CSS v4** — via `@tailwindcss/vite`
- **React 19** — for interactive islands only (TOC, sidebar, color scheme picker)
- **Shiki** — built-in code highlighting with dual-theme support

## Key Directories

```
src/
├── components/          # Astro + React components
│   └── admonitions/     # Note, Tip, Info, Warning, Danger
├── config/              # Settings, color schemes
├── content/
│   ├── docs/            # English MDX content
│   └── docs-ja/         # Japanese MDX content
├── hooks/               # React hooks (scroll spy)
├── layouts/             # Astro layouts (doc-layout)
├── pages/               # File-based routing
│   ├── docs/[...slug]   # English doc routes
│   └── ja/docs/[...slug] # Japanese doc routes
├── plugins/             # Rehype plugins
├── integrations/        # Astro integrations (search, history, sitemap)
└── styles/
    └── global.css       # Design tokens (@theme) & Tailwind config
```

## Article Files

- Format: MDX with YAML frontmatter (`sidebar_position`)
- Location: `src/content/docs/<category>/`
- File naming: **kebab-case** (e.g., `centering-techniques.mdx`)
- Categories: layout, typography, color, visual, responsive, interactive, methodology, inbox, claude (auto-generated)

### Article Structure

Follow this pattern for all articles:

1. `## The Problem` — what goes wrong, common mistakes
2. `## The Solution` — recommended approach with CssPreview demos
3. More sections with demos as needed
4. `## When to Use` — summary of when this technique applies

### CssPreview Demos

**Always include CssPreview demos** — they are the most valuable part of each article.

Key details:

- Renders inside an **iframe** — all CSS is fully isolated
- Viewport buttons: Mobile (320px), Tablet (768px), Full (~900-1100px)
- No JavaScript — interactions must be CSS-only (`:hover`, `:focus`, `:checked`, etc.)

### CSS Conventions in Demos

- Use `hsl()` colors, not hex
- Use descriptive BEM-ish class names (e.g., `.card-demo__header`)
- Use `font-family: system-ui, sans-serif` for body text
- Minimum font size: 0.75rem / 12px for labels
- **Template literal indentation**: Always indent `css={}` and `html={}` content by at least 2 spaces. The `dedent()` utility strips common leading whitespace before displaying code in the panel. Content at column 0 produces unindented code display.

## Design Token System

Uses a 16-color palette with OKLCH orange accent (`oklch(55.5% 0.163 48.998)`).

### Color Rules

- **NEVER** use Tailwind default colors (`bg-gray-500`, `text-blue-600`)
- **ALWAYS** use project tokens: `text-fg`, `bg-surface`, `border-muted`, `text-accent`, etc.
- Use palette tokens (`p0`–`p15`) only when no semantic token fits

### Color Schemes

- Default: **ZCSS Dark** (warm dark theme with orange accents)
- Light: **ZCSS Light** (warm light theme with orange accents)
- Configured in `src/config/settings.ts` and `src/config/color-schemes.ts`

## Admonitions

Available in all MDX files without imports:
`<Note>`, `<Tip>`, `<Info>`, `<Warning>`, `<Danger>` — each accepts optional `title` prop.

## Claude Code Skills

This repo manages zcss-specific Claude Code skills in `.claude/skills/`:

- **`css-wisdom`** — Topic index of all CSS articles. Symlinked to `~/.claude/skills/css-wisdom` so it's available globally. **When adding or removing articles, run `pnpm generate:css-wisdom` to regenerate the topic index.** Add descriptions for new articles to `.claude/skills/css-wisdom/descriptions.json`.
- **`l-writing`** — Writing and formatting rules for MDX articles. **Before writing or editing docs, invoke `/l-writing`.**
- **`l-handle-deep-article`** — Guide for converting flat articles into deep articles with sub-pages. Local to this repo.
- **`l-demo-component`** — Guide for CssPreview component usage and `defaultOpen` prop conventions. Local to this repo.
- **`l-translate`** — Translate English docs to Japanese using the `ja-translator` subagent. Invoke `/l-translate <path-or-category>`.
- **`b4push`** — Before-push quality checks (type check, build, link check). Invoke `/b4push`.

### Agents

- **`ja-translator`** — Subagent for translating MDX docs from English to Japanese.

### Translation Workflow

After editing or creating an English doc, translate the Japanese counterpart using `/l-translate`. After editing a Japanese doc, update the English counterpart similarly.

## Safety Rules

- `rm -rf`: relative paths only (`./path`), never absolute
- No force push, no `--amend` unless explicitly permitted
- Temp files go to `__inbox/` (gitignored)
