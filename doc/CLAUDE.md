# doc/ — Astro Documentation Site

CSS best practices documentation site built with Astro 5, MDX, Tailwind CSS v4, and React islands (zudo-doc framework).

## Commands

```bash
pnpm install            # Install dependencies
pnpm dev                # Dev server → http://css-bp.localhost:8811
pnpm build              # Production build → dist/
pnpm preview            # Preview build
pnpm check              # Astro type checking
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
- Categories: layout, typography, color, visual, responsive, interactive, methodology, inbox, overview

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
