# zcss — zudo-css

Documentation site teaching CSS best practices, built with zudo-doc (Astro 5 + MDX + Tailwind CSS v4).

## Project Structure

```
zcss/
  doc/                    # zudo-doc site (all dev happens here)
    src/content/docs/     # MDX articles by category
    src/content/docs-ja/  # Japanese locale articles
    src/components/       # CssPreview, PreviewBase, TailwindPreview, etc.
    src/config/           # Settings, color schemes, sidebars, i18n
    src/layouts/          # Astro layouts
    src/pages/            # Astro page routes
    src/plugins/          # Rehype plugins
    src/integrations/     # Astro integrations (search, doc-history, sitemap)
    src/styles/           # Global CSS (Tailwind v4 + design tokens)
    src/utils/            # Utility functions
    public/               # Static assets
  .husky/                 # Git hooks (pre-commit: lint-staged)
  .claude/skills/         # Claude Code skills managed in this repo
```

## Development

Package manager: **pnpm** (Node.js >= 20). All commands run inside `doc/`:

```bash
cd doc
pnpm install && pnpm dev     # Dev server → http://css-bp.localhost:8811
pnpm build                   # Production build
pnpm check                   # Typecheck
```

See `doc/CLAUDE.md` for detailed article-writing guidelines, component reference, and conventions.

## Claude Code Skills

This repo manages zcss-specific Claude Code skills in `.claude/skills/`:

- **`css-wisdom`** — Topic index of all CSS articles. Symlinked to `~/.claude/skills/css-wisdom` so it's available globally. **When adding or removing articles, run `pnpm generate:css-wisdom` to regenerate the topic index.** Add descriptions for new articles to `.claude/skills/css-wisdom/descriptions.json`.
- **`l-handle-deep-article`** — Guide for converting flat articles into deep articles with sub-pages. Local to this repo.
- **`l-demo-component`** — Guide for CssPreview component usage and `defaultOpen` prop conventions. Local to this repo.

## Safety Rules

- `rm -rf`: relative paths only (`./path`), never absolute
- No force push, no `--amend` unless explicitly permitted
- Temp files go to `__inbox/` (gitignored)
