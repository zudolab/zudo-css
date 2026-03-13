export type {
  HeaderNavItem,
  ColorModeConfig,
  LocaleConfig,
} from "./settings-types";
import type {
  HeaderNavItem,
  ColorModeConfig,
  LocaleConfig,
} from "./settings-types";

export const settings = {
  colorScheme: "ZCSS Dark",
  colorMode: {
    defaultMode: "dark",
    lightScheme: "ZCSS Light",
    darkScheme: "ZCSS Dark",
    respectPrefersColorScheme: true,
  } as ColorModeConfig | false,
  siteName: "zudo-css",
  siteDescription: "CSS best practices — practical techniques for modern web development" as string,
  base: "/pj/zcss/",
  docsDir: "src/content/docs",
  locales: {
    ja: { label: "JA", dir: "src/content/docs-ja" },
  } satisfies Record<string, LocaleConfig>,
  mermaid: false,
  noindex: false as boolean,
  editUrl: false as string | false,
  siteUrl: "" as string,
  sitemap: true,
  docMetainfo: true,
  docTags: false,
  math: false,
  docHistory: true,
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
  ] as HeaderNavItem[],
};
