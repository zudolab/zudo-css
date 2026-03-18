# zudo-css

CSS best practices documentation site for AI coding agents. Curated techniques and patterns with live CssPreview demos.

**Live site:** [zudo-css.pages.dev](https://zudo-css.pages.dev/pj/zcss/)

## Tech Stack

- **Astro 5** — static site generator with Content Collections
- **MDX** — content format with interactive components
- **Tailwind CSS v4** — utility-first styling via `@tailwindcss/vite`
- **React 19** — interactive islands (TOC, sidebar, color scheme picker)
- **Shiki** — code highlighting with dual-theme support
- **Cloudflare Pages** — deployment via GitHub Actions

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
```

### Article Categories

layout, typography, color, visual, responsive, interactive, methodology, overview

## Development

Requires **Node.js >= 20** and **pnpm**.

```bash
pnpm install
pnpm dev              # Dev server → http://css-bp.localhost:8811
pnpm build            # Production build → dist/
pnpm preview          # Preview production build
pnpm check            # Astro type checking
```

## Claude Code Integration

This repo includes a `css-wisdom` skill that indexes all CSS articles for AI-assisted development.

```bash
pnpm run setup:symlink    # Install skill globally
pnpm run generate:css-wisdom  # Regenerate topic index after adding/removing articles
```

Once installed, invoke via `/css-wisdom <topic>` in Claude Code to look up CSS best practices.
