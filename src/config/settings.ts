export type {
  HeaderNavItem,
  ColorModeConfig,
  LocaleConfig,
  VersionConfig,
  FooterConfig,
  HtmlPreviewConfig,
} from "./settings-types";
import type {
  HeaderNavItem,
  ColorModeConfig,
  LocaleConfig,
  VersionConfig,
  FooterConfig,
  HtmlPreviewConfig,
} from "./settings-types";

export const settings = {
  colorScheme: "Default Dark",
  colorMode: {
    defaultMode: "dark",
    lightScheme: "Default Light",
    darkScheme: "Default Dark",
    respectPrefersColorScheme: true,
  } as ColorModeConfig | false,
  siteName: "zudo-css",
  siteDescription: "CSS best practices — practical techniques for modern web development" as string,
  base: "/pj/zcss/",
  docsDir: "src/content/docs",
  locales: {
    ja: { label: "JA", dir: "src/content/docs-ja" },
  } satisfies Record<string, LocaleConfig>,
  trailingSlash: true,
  mermaid: false,
  math: false,
  noindex: false as boolean,
  editUrl: false as string | false,
  siteUrl: "" as string,
  sitemap: true,
  docMetainfo: true,
  docTags: false,
  docHistory: true,
  aiAssistant: false,
  llmsTxt: true,
  colorTweakPanel: false,
  versions: false as VersionConfig[] | false,
  footer: {
    links: [
      {
        title: "Fundamentals",
        locales: { ja: { title: "基本戦略" } },
        items: [
          {
            label: "Tight Token Strategy",
            href: "/docs/methodology/tight-token-strategy",
            locales: { ja: { label: "タイトトークン戦略" } },
          },
          {
            label: "Component First Strategy",
            href: "/docs/methodology/component-first-strategy",
            locales: { ja: { label: "コンポーネントファースト戦略" } },
          },
          {
            label: "Three-Tier Color Strategy",
            href: "/docs/color/three-tier-color-strategy",
            locales: { ja: { label: "3層カラー戦略" } },
          },
        ],
      },
    ],
    copyright: `Copyright © ${new Date().getFullYear()} <a href="https://x.com/Takazudo">Takazudo</a>. Built with <a href="https://takazudomodular.com/pj/zudo-doc">zudo-doc</a>.`,
  } satisfies FooterConfig as FooterConfig | false,
  htmlPreview: false as HtmlPreviewConfig | false,
  claudeResources: false as { claudeDir: string; projectRoot?: string } | false,
  headerNav: [
    { label: "Overview", path: "/docs/overview", categoryMatch: "overview" },
    { label: "Layout", path: "/docs/layout", categoryMatch: "layout" },
    { label: "Typography", path: "/docs/typography", categoryMatch: "typography" },
    { label: "Visual", path: "/docs/visual", categoryMatch: "visual" },
    { label: "Color", path: "/docs/color", categoryMatch: "color" },
    { label: "Responsive", path: "/docs/responsive", categoryMatch: "responsive" },
    { label: "Interactive", path: "/docs/interactive", categoryMatch: "interactive" },
    { label: "Methodology", path: "/docs/methodology", categoryMatch: "methodology" },
    { label: "Misc", path: "/docs/misc", categoryMatch: "misc" },
  ] as HeaderNavItem[],
};
