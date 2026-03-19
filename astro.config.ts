import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import {
  transformerMetaHighlight,
  transformerMetaWordHighlight,
} from "@shikijs/transformers";
import tailwindcss from "@tailwindcss/vite";
import { colorSchemes } from "./src/config/color-schemes";
import { settings } from "./src/config/settings";
import { claudeResourcesIntegration } from "./src/integrations/claude-resources";
import { docHistoryIntegration } from "./src/integrations/doc-history";
import { searchIndexIntegration } from "./src/integrations/search-index";
import { llmsTxtIntegration } from "./src/integrations/llms-txt";
import { sitemapIntegration } from "./src/integrations/sitemap";
import remarkDirective from "remark-directive";
import { remarkAdmonitions } from "./src/plugins/remark-admonitions";
import { rehypeCodeTitle } from "./src/plugins/rehype-code-title";
import { rehypeHeadingLinks } from "./src/plugins/rehype-heading-links";
import { rehypeStripMdExtension } from "./src/plugins/rehype-strip-md-extension";

const activeScheme = colorSchemes[settings.colorScheme];
const shikiTheme = activeScheme?.shikiTheme ?? "dracula";

const shikiTransformers = [
  transformerMetaHighlight(),
  transformerMetaWordHighlight(),
];

const shikiConfig = settings.colorMode
  ? {
      themes: {
        light:
          colorSchemes[settings.colorMode.lightScheme]?.shikiTheme ??
          "github-light",
        dark:
          colorSchemes[settings.colorMode.darkScheme]?.shikiTheme ?? "dracula",
      },
      defaultColor: false as const,
      transformers: shikiTransformers,
    }
  : {
      theme: shikiTheme,
      transformers: shikiTransformers,
    };

export default defineConfig({
  site: "https://takazudomodular.com",
  output: "static",
  trailingSlash: settings.trailingSlash ? "always" : "never",
  base: settings.base,
  integrations: [
    mdx(),
    react(),
    searchIndexIntegration(),
    ...(settings.sitemap && !settings.noindex ? [sitemapIntegration()] : []),
    ...(settings.docHistory ? [docHistoryIntegration()] : []),
    ...(settings.claudeResources
      ? [claudeResourcesIntegration(settings.claudeResources)]
      : []),
    ...(settings.llmsTxt ? [llmsTxtIntegration()] : []),
  ],
  i18n: {
    defaultLocale: "en",
    locales: ["en", ...Object.keys(settings.locales)],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        // mermaid is not used in zcss — stub the dynamic import to avoid build failure
        external: settings.mermaid ? [] : ["mermaid"],
      },
    },
  },
  markdown: {
    shikiConfig,
    remarkPlugins: [
      remarkDirective, // Must run before remarkAdmonitions
      remarkAdmonitions,
    ],
    rehypePlugins: [
      rehypeCodeTitle,
      rehypeHeadingLinks, // Must run before Astro's built-in heading ID plugin
      rehypeStripMdExtension,
    ],
  },
});
