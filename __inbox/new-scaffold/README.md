# zudo-css

CSS best practices documentation site for AI coding agents. Curated techniques and patterns with live CssPreview demos.

AIコーディングエージェント向けのCSSベストプラクティスドキュメントサイトです。厳選されたCSS技法とパターンを、ライブCssPreviewデモとともに提供します。

**Live site:** [zudo-css.pages.dev](https://zudo-css.pages.dev/pj/zcss/)

## Tech Stack / 技術スタック

- **Astro 5** — static site generator with Content Collections / コンテンツコレクション対応の静的サイトジェネレーター
- **MDX** — content format with interactive components / インタラクティブコンポーネント対応のコンテンツ形式
- **Tailwind CSS v4** — utility-first styling via `@tailwindcss/vite`
- **React 19** — interactive islands (TOC, sidebar, color scheme picker) / インタラクティブアイランド（目次、サイドバー、カラースキーム切替）
- **Shiki** — code highlighting with dual-theme support / デュアルテーマ対応のコードハイライト
- **Cloudflare Pages** — deployment via GitHub Actions / GitHub Actionsによるデプロイ

## Project Structure / プロジェクト構成

```
src/content/docs/       # MDX articles by category (English) / カテゴリ別MDX記事（英語）
src/content/docs-ja/    # Japanese locale articles / 日本語ロケール記事
src/components/         # CssPreview, PreviewBase, TailwindPreview, etc.
src/config/             # Settings, color schemes, sidebars, i18n / 設定、カラースキーム、サイドバー、国際化
src/layouts/            # Astro layouts / Astroレイアウト
src/pages/              # Astro page routes / Astroページルーティング
src/plugins/            # Rehype plugins / Rehypeプラグイン
src/integrations/       # Astro integrations (search, doc-history, sitemap) / Astroインテグレーション
src/styles/             # Global CSS (Tailwind v4 + design tokens) / グローバルCSS
```

### Article Categories / 記事カテゴリ

| Category | Description / 説明 |
| --- | --- |
| Layout | Flexbox, Grid, positioning, centering, spacing / レイアウト全般 |
| Typography | Font sizing, line clamping, vertical rhythm / 文字組み |
| Color | Color systems, oklch, color-mix, theming / カラーシステム |
| Visual | Shadows, gradients, borders, filters / 視覚効果 |
| Responsive | Container queries, fluid design / レスポンシブデザイン |
| Interactive | Hover/focus, transitions, animations / インタラクション |
| Methodology | BEM, CSS Modules, design tokens, cascade layers / 設計手法 |
| Misc | Writing style guides, contribution conventions / 執筆ガイド、規約 |

## Development / 開発

Requires **Node.js >= 20** and **pnpm**.

```bash
pnpm install
pnpm dev              # Dev server → http://css-bp.localhost:8811
pnpm build            # Production build → dist/
pnpm preview          # Preview production build
pnpm check            # Astro type checking
pnpm b4push           # Run all quality checks before pushing
```

## Claude Code Integration / Claude Code連携

This repo includes a `css-wisdom` skill that indexes all CSS articles for AI-assisted development.

このリポジトリには、AI開発支援のためにすべてのCSS記事をインデックスする `css-wisdom` スキルが含まれています。

```bash
pnpm run setup:doc-skill      # Install skill globally / スキルをグローバルにインストール
pnpm run generate:css-wisdom  # Regenerate topic index / トピックインデックスを再生成
```

Once installed, invoke via `/css-wisdom <topic>` in Claude Code to look up CSS best practices.

インストール後、Claude Codeで `/css-wisdom <トピック>` を実行するとCSSベストプラクティスを参照できます。
