export interface HeaderNavItem {
  label: string;
  labelKey?: string;
  path: string;
  categoryMatch?: string;
}

export interface ColorModeConfig {
  defaultMode: "light" | "dark";
  lightScheme: string;
  darkScheme: string;
  respectPrefersColorScheme: boolean;
}

export interface LocaleConfig {
  label: string;
  dir: string;
}

export interface VersionConfig {
  slug: string;
  label: string;
  docsDir: string;
  locales?: Record<string, LocaleConfig>;
  banner?: "outdated" | "preview";
}

export interface FooterLinkItem {
  label: string;
  href: string;
}

export interface FooterLinkColumn {
  title: string;
  items: FooterLinkItem[];
}

export interface FooterConfig {
  links: FooterLinkColumn[];
  copyright?: string;
}

export interface HtmlPreviewConfig {
  head?: string;
  css?: string;
  js?: string;
}
