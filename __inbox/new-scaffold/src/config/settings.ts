export type {
  HeaderNavChildItem,
  HeaderNavItem,
  ColorModeConfig,
  HtmlPreviewConfig,
  LocaleConfig,
  VersionConfig,
  FooterConfig,
  TagPlacement,
  FrontmatterPreviewConfig,
  TagGovernanceMode,
  TagVocabularyEntry,
} from "./settings-types";
import type {
  HeaderNavItem,
  ColorModeConfig,
  HtmlPreviewConfig,
  LocaleConfig,
  VersionConfig,
  FooterConfig,
  TagPlacement,
  FrontmatterPreviewConfig,
  TagGovernanceMode,
  TagVocabularyEntry,
} from "./settings-types";

export const settings = {
  colorScheme: "Default Dark",
  colorMode: {
    defaultMode: "dark",
    lightScheme: "Default Light",
    darkScheme: "Default Dark",
    respectPrefersColorScheme: true,
  } satisfies ColorModeConfig,
  siteName: "zudo-css-wisdom",
  siteDescription: "Pragmatic CSS knowledge for AI" as string,
  base: "/pj/zcss/",
  trailingSlash: true as boolean,
  noindex: false as boolean,
  editUrl: false as string | false,
  siteUrl: "https://takazudomodular.com/pj/zcss/" as string,
  // Workaround for zudo-doc#401 — scaffold's header.astro reads settings.githubUrl
  // but the default settings.ts doesn't declare it. Declared as false (no link).
  githubUrl: false as string | false,
  // URL-shape override (see MIGRATION_NOTES.md → "URL-shape override — Sub #49"):
  // Preset ran with `defaultLang: "ja"` but zcss keeps EN as the URL-default locale
  // (EN at `/pj/zcss/docs/...`, JA at `/pj/zcss/ja/docs/...`). So `docsDir` is the
  // EN root and `locales` declares `ja` as the additional locale.
  docsDir: "src/content/docs",
  locales: {
    ja: { label: "JA", dir: "src/content/docs-ja" },
  } as Record<string, LocaleConfig>,
  mermaid: false,
  sitemap: true,
  docMetainfo: true,
  docTags: false,
  // Workaround for zudo-doc#401 — framework reads these from settings but the
  // scaffold default settings.ts doesn't declare them. Safe defaults keep
  // `pnpm check` clean until the upstream generator is fixed.
  tagPlacement: "after-title" as TagPlacement,
  frontmatterPreview: false as FrontmatterPreviewConfig | false,
  tagVocabulary: false as TagVocabularyEntry[] | false,
  tagGovernance: "off" as TagGovernanceMode,
  llmsTxt: true,
  math: false,
  cjkFriendly: true as boolean,
  onBrokenMarkdownLinks: "warn" as "warn" | "error" | "ignore",
  aiAssistant: false as boolean,
  docHistory: true,
  colorTweakPanel: false as boolean,
  sidebarResizer: true as boolean,
  sidebarToggle: true as boolean,
  htmlPreview: undefined as HtmlPreviewConfig | undefined,
  versions: false as VersionConfig[] | false,
  claudeResources: {
    claudeDir: ".claude",
  } as { claudeDir: string; projectRoot?: string } | false,
  footer: {
    links: [
      {
        title: "Fundamentals",
        locales: { ja: { title: "基本戦略" } },
        items: [
          {
            label: "Tight Token Strategy",
            href: "/docs/methodology/design-systems/tight-token-strategy",
            locales: { ja: { label: "タイトトークン戦略" } },
          },
          {
            label: "Component First Strategy",
            href: "/docs/methodology/architecture/component-first-strategy",
            locales: { ja: { label: "コンポーネントファースト戦略" } },
          },
          {
            label: "Three-Tier Color Strategy",
            href: "/docs/styling/color/three-tier-color-strategy",
            locales: { ja: { label: "3層カラー戦略" } },
          },
        ],
      },
    ],
    copyright: `Copyright © ${new Date().getFullYear()} <a href="https://x.com/Takazudo">Takazudo</a>. Built with <a href="https://takazudomodular.com/pj/zudo-doc">zudo-doc</a>. Enjoy synth on <a href="https://takazudomodular.com/">Takazudo Modular</a>.`,
  } satisfies FooterConfig as FooterConfig | false,
  headerNav: [
    { label: "Overview", path: "/docs/overview", categoryMatch: "overview" },
    { label: "Methodology", path: "/docs/methodology", categoryMatch: "methodology" },
    { label: "Layout", path: "/docs/layout", categoryMatch: "layout" },
    { label: "Typography", path: "/docs/typography", categoryMatch: "typography" },
    { label: "Styling", path: "/docs/styling", categoryMatch: "styling" },
    { label: "Responsive", path: "/docs/responsive", categoryMatch: "responsive" },
    { label: "Interactive", path: "/docs/interactive", categoryMatch: "interactive" },
    { label: "Claude", path: "/docs/claude", categoryMatch: "claude" },
  ] as HeaderNavItem[],
};
