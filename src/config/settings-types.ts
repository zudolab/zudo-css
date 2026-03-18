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
  locales?: Record<string, { dir: string }>;
  banner?: "unmaintained" | "unreleased" | false;
}

export interface FooterLinkItem {
  label: string;
  href: string;
  /** Per-locale overrides for label */
  locales?: Record<string, { label: string }>;
}

export interface FooterLinkColumn {
  title: string;
  items: FooterLinkItem[];
  /** Per-locale overrides for title */
  locales?: Record<string, { title: string }>;
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
