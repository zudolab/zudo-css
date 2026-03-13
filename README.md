# CSS Best Practices for AI

Curated CSS techniques and patterns documented as references for AI coding agents.

## Structure

```
doc/            # Docusaurus site
  docs/         # Documentation content (markdown)
    layout/           # Flexbox, Grid, positioning, spacing, sizing
    typography/       # Font sizing, line clamping, vertical rhythm
    color/            # Color systems, oklch, color-mix
    visual/           # Shadows, gradients, borders, filters
    responsive/       # Container queries, fluid design
    interactive/      # Hover/focus, transitions, animations
    methodology/      # BEM, CSS Modules, utility-first, design tokens, cascade layers
```

## Development

```bash
cd doc
pnpm install
pnpm start
```

## Claude Code Integration

This repo includes a `css-wisdom` skill that provides Claude Code with an indexed reference of all CSS articles. To make it available globally:

```bash
pnpm run setup:symlink
```

This creates a symlink at `~/.claude/skills/css-wisdom` pointing to this repo's `.claude/skills/css-wisdom/`.

When adding or removing articles, regenerate the topic index:

```bash
pnpm run generate:css-wisdom
```

The generator reads `doc/docs/` and curated descriptions from `.claude/skills/css-wisdom/descriptions.json` to produce the SKILL.md topic index.
