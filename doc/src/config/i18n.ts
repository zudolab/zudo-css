import type { CollectionKey } from "astro:content";
import { settings } from "./settings";

/** Default locale code (always "en", served from docsDir). */
export const defaultLocale = "en" as const;

/** All supported locale codes, derived from settings. */
export const locales = [
  defaultLocale,
  ...(Object.keys(settings.locales) as Array<keyof typeof settings.locales>),
] as const;
export type Locale = (typeof locales)[number];

type LocaleKey = keyof typeof settings.locales;

/** Safely look up a locale in settings.locales. */
function getLocaleConfig(locale: string) {
  return (settings.locales as Record<string, (typeof settings.locales)[LocaleKey]>)[locale];
}

/** Get the content directory for a locale. */
export function getContentDir(locale: Locale | string): string {
  if (locale === defaultLocale) return settings.docsDir;
  return getLocaleConfig(locale)?.dir ?? settings.docsDir;
}

/**
 * Get the Astro content collection name for a locale.
 * Returns a CollectionKey so it can be passed directly to getCollection().
 * The cast is safe because collections are dynamically created in content.config.ts
 * for every locale in settings.locales.
 */
export function getCollectionName(locale: Locale | string): CollectionKey {
  if (locale === defaultLocale) return "docs";
  return `docs-${locale}` as CollectionKey;
}

/** Get the display label for a locale. */
export function getLocaleLabel(locale: Locale | string): string {
  if (locale === defaultLocale) return "EN";
  return getLocaleConfig(locale)?.label ?? locale.toUpperCase();
}

/** Detect locale from a URL pathname (after base stripping). */
export function detectLocaleFromPath(path: string): Locale {
  for (const code of Object.keys(settings.locales)) {
    if (path.startsWith(`/${code}/`) || path === `/${code}`) {
      return code as Locale;
    }
  }
  return defaultLocale;
}

/** UI string translations */
const translations: Record<string, Record<string, string>> = {
  en: {
    "nav.gettingStarted": "Getting Started",
    "nav.guides": "Guides",
    "nav.reference": "Reference",
    "nav.api": "API",
    "nav.claude": "Claude",
    "nav.previous": "Previous",
    "nav.next": "Next",
    "toc.title": "On this page",
    "docs.browseAll": "Browse all documentation sections.",
    "search.label": "Search",
    "code.copy": "Copy code",
    "code.copied": "Copied!",
    "code.wrapToggle": "Toggle word wrap",
    "nav.backToMenu": "Back to main menu",
    "doc.editPage": "Edit this page",
    "doc.tags": "Tags",
    "doc.taggedWith": "Pages tagged with",
    "doc.allTags": "All Tags",
    "doc.created": "Created",
    "doc.updated": "Updated",
    "doc.noTags": "No tags found.",
    "doc.pageCount": "{count} pages",
    "doc.pageCountSingle": "{count} page",
    "doc.fallbackNotice":
      "This page has not been translated yet and is shown in the original language.",
  },
  ja: {
    "nav.gettingStarted": "はじめに",
    "nav.guides": "ガイド",
    "nav.reference": "リファレンス",
    "nav.api": "API",
    "nav.claude": "Claude",
    "nav.previous": "前へ",
    "nav.next": "次へ",
    "toc.title": "目次",
    "docs.browseAll": "すべてのドキュメントセクションを閲覧",
    "search.label": "検索",
    "code.copy": "コードをコピー",
    "code.copied": "コピーしました！",
    "code.wrapToggle": "折り返し切替",
    "nav.backToMenu": "メインメニューに戻る",
    "doc.editPage": "このページを編集",
    "doc.tags": "タグ",
    "doc.taggedWith": "タグ付きページ",
    "doc.allTags": "すべてのタグ",
    "doc.created": "作成",
    "doc.updated": "更新",
    "doc.noTags": "タグが見つかりません。",
    "doc.pageCount": "{count}ページ",
    "doc.pageCountSingle": "{count}ページ",
    "doc.fallbackNotice":
      "このページはまだ翻訳されていません。原文のまま表示しています。",
  },
};

/** Get a translated UI string */
export function t(key: string, locale: Locale | string = defaultLocale): string {
  return translations[locale]?.[key] ?? translations[defaultLocale]?.[key] ?? key;
}
