# MIGRATION_NOTES — zudo-doc rebuild (Sub #48)

Snapshot of the fresh `create-zudo-doc` scaffold generated for epic #47
(zudolab/zudo-css-wisdom). This file lives at `__inbox/new-scaffold/` and is
only a staging artefact — the sub-issues under #47 migrate zcss content into
it and then the whole scaffold is swapped into the repo root in Sub #59.

## How this scaffold was produced

```sh
cd __inbox
node /Users/takazudo/repos/myoss/zudo-doc/packages/create-zudo-doc/dist/index.js \
  --preset ./zcss-preset.json \
  --name new-scaffold \
  --no-install
```

The positional `projectName` in the preset is `"zudo-css-wisdom"`; `--name
new-scaffold` overrides it so the output folder lands at
`__inbox/new-scaffold/` instead of a nested `__inbox/zudo-css-wisdom/`. The
scaffolder consumed the preset, filled in any omitted options with its
non-interactive defaults, and composed the templates described below.

`pnpm install --ignore-workspace --prefer-offline` was then run inside
`__inbox/new-scaffold/` to produce `pnpm-lock.yaml` and verify the scaffold
is self-consistent. `--ignore-workspace` was a safety belt — this repo has
no `pnpm-workspace.yaml`, so there was no workspace to stumble over.

## Applied preset features

From `__inbox/zcss-preset.json`:

```
search, sidebarFilter, i18n, claudeResources, claudeSkills,
sidebarResizer, sidebarToggle, docHistory, llmsTxt, skillSymlinker,
tauri, footerNavGroup, footerCopyright
```

Color scheme: `light-dark` with `Default Light` / `Default Dark`, defaulting
to dark and respecting the OS `prefers-color-scheme`. Package manager:
`pnpm`. `cjkFriendly: true` in the preset (see Concerns).

## Scaffold templates used

Base layer:

- `templates/base/` — shared framework: `astro.config.ts` shell,
  `src/content.config.ts`, `src/pages/`, `src/layouts/`, `src/components/`,
  `src/integrations/`, `src/plugins/`, `src/config/`, `src/styles/`,
  `src/utils/`, `src/hooks/`, `src/types/`, `tsconfig.json`, `scripts/`,
  scaffold `CLAUDE.md`, scaffold-level `.gitignore`.

Per-feature layers (`templates/features/<feature>/`) composed on top of
base for every preset feature that has a template dir:

- `templates/features/search/`
- `templates/features/i18n/`
- `templates/features/claudeResources/`
- `templates/features/sidebarResizer/`
- `templates/features/sidebarToggle/`
- `templates/features/docHistory/`
- `templates/features/llmsTxt/`
- `templates/features/tauri/` — produces `src-tauri/` (Cargo.toml, main.rs,
  tauri.conf.json, capabilities, build.rs)
- `templates/features/footer/` — pseudo-feature triggered by
  `footerNavGroup` and `footerCopyright`

Features handled without a separate template dir (per
`create-zudo-doc/src/features/index.ts`):

- **sidebarFilter** — baked into `src/components/sidebar-tree.tsx`, stays in
  base.
- **claudeSkills** — `scaffold.ts` copies `zudo-doc-*` skills
  (design-system, translate, version-bump) from the zudo-doc monorepo into
  `.claude/skills/`.
- **skillSymlinker** — `scaffold.ts` produces `scripts/setup-doc-skill.sh`
  and wires the matching `setup:doc-skill` package.json script.

## Version delta table

"Before" = `/Users/takazudo/repos/wisdom/zudo-css-wisdom/package.json` on
`base/zudo-doc-rebuild` (the pre-rebuild zcss). "After" =
`__inbox/new-scaffold/package.json` as produced by the scaffolder.

| Dep | Before (zcss) | After (scaffold) | Change | Notes |
|---|---|---|---|---|
| astro | ^6.0.4 | ^5.18.0 | **MAJOR DOWN** | Scaffold ships the zudo-doc-blessed Astro 5 line. Re-upgrade to 6 is a separate concern — today's `patches/astro@6.0.4.patch` will need replanning. |
| @astrojs/mdx | ^5.0.0 | ^4.3.0 | **MAJOR DOWN** | Paired with Astro 5. |
| @astrojs/react | ^5.0.0 | — | **REMOVED** | Scaffold switches the islands runtime to Preact. |
| @astrojs/preact | — | ^4.1.0 | **NEW** | With `compat: true`, so React-shaped code can keep its `react`/`react-dom` import specifiers via the alias. |
| react | ^19.2.4 | — | **REMOVED** | Preact compat replaces runtime React. |
| react-dom | ^19.2.4 | — | **REMOVED** | Ditto. |
| preact | — | ^10.26.0 | **NEW** | Runtime for islands. |
| @tailwindcss/vite | ^4.2.1 | ^4.2.0 | patch float | Same major. |
| tailwindcss | ^4.2.1 | ^4.2.0 | patch float | Same major. |
| @shikijs/transformers | ^4.0.1 | ^4.0.0 | patch float | Same major. |
| shiki | ^4.0.2 | — | **REMOVED** | Scaffold relies on Astro-bundled Shiki; direct import is gone. Any custom `import { ... } from "shiki"` in migrated code must switch to Astro's re-export or re-add shiki explicitly. |
| remark-directive | ^4.0.0 | ^3.0.0 | **MAJOR DOWN** | Scaffold pins v3. Our admonition pipeline must verify compatibility when sub-issues port remark plugins. |
| unist-util-visit | ^5.1.0 | ^5.1.0 | none | |
| clsx | ^2.1.1 | ^2.1.0 | patch float | |
| diff | ^8.0.3 | ^8.0.3 | none | (Scaffold keeps v8 for the DocHistory diff view.) |
| github-slugger | ^2.0.0 | ^2.0.0 | none | |
| gray-matter | ^4.0.3 | ^4.0.0 | patch float | |
| minisearch | ^7.2.0 | ^7.2.0 | none | |
| remark-cjk-friendly | — | ^2.0.1 | **NEW** | Declared by the scaffold because the preset has `cjkFriendly: true` — but see the Concerns section. |
| @astrojs/check | ^0.9.7 | ^0.9.0 | patch float | |
| @types/hast | ^3.0.4 | ^3.0.4 | none | |
| @types/mdast | ^4.0.4 | ^4.0.4 | none | |
| @types/node | ^25.3.5 | ^22.0.0 | **MAJOR DOWN** | Scaffold pins Node 22 types. Our CI / engines > 20 remains compatible. |
| @types/react | ^19.2.14 | ^19.2.0 | patch float | Scaffold keeps React types for Preact `compat` typings. |
| @types/react-dom | ^19.2.3 | — | **REMOVED** | No standalone react-dom types needed with Preact. |
| typescript | ^5.9.3 | ^5.9.0 | patch float | |
| pagefind | — | ^1.4.0 | **NEW** | Scaffold wires Pagefind as the search backend. |
| lefthook | ^1.11.13 | — | **REMOVED** | Sub-issues port back via scripts. |
| prettier | ^3.5.3 | — | **REMOVED** | Ditto. |
| prettier-plugin-astro | ^0.14.1 | — | **REMOVED** | Ditto. |
| vitest | ^3.2.1 | — | **REMOVED** | Ditto. |

### Astro patch

Current `package.json` has:

```
"pnpm": {
  "patchedDependencies": {
    "astro@6.0.4": "patches/astro@6.0.4.patch"
  }
}
```

The scaffold is on Astro 5, so the existing patch file cannot apply as-is.
Downstream sub-issues must decide whether the patch is still needed, and if
so re-issue against whichever Astro version the rebuilt repo lands on.

## Scaffold layout snapshot

```
__inbox/new-scaffold/
├── .claude/skills/
│   ├── zudo-doc-design-system/
│   ├── zudo-doc-translate/
│   └── zudo-doc-version-bump/
├── .gitignore                  (scaffold-level: node_modules, dist, .astro, src-tauri/{target,gen})
├── CLAUDE.md                   (scaffold default — Sub #57 replaces with zcss CLAUDE.md)
├── astro.config.ts
├── package.json
├── pnpm-lock.yaml
├── scripts/
│   └── setup-doc-skill.sh
├── src/
│   ├── components/             (admonitions, doc-history, sidebar-tree, search, etc.)
│   ├── config/                 (settings.ts, color-schemes.ts, sidebars.ts, ...)
│   ├── content.config.ts
│   ├── content/
│   │   ├── docs/               (default lang == ja; has the starter "ようこそ" page)
│   │   └── docs-en/            (EN locale dir per i18n feature)
│   ├── hooks/
│   ├── integrations/
│   ├── layouts/doc-layout.astro
│   ├── pages/                  (404.astro, docs/, en/, index.astro)
│   ├── plugins/                (remark + rehype plugin set)
│   ├── scripts/
│   ├── styles/
│   ├── types/
│   └── utils/
├── src-tauri/                  (tauri feature output)
└── tsconfig.json
```

## URL-shape override — **deferred to Sub #49**

The preset's `defaultLang: "ja"` caused the scaffold to treat Japanese as
the default locale. In the generated `src/config/settings.ts`:

```
docsDir: "src/content/docs",                               // -> ja
locales: { en: { label: "EN", dir: "src/content/docs-en" } },
```

And in `astro.config.ts` the i18n block hard-codes `defaultLocale: "ja"`
and builds the locale list from `["ja", ...Object.keys(settings.locales)]`.

Epic #47 overrides this to preserve the live zcss URL shape (EN at
`/docs/…`, JA at `/ja/docs/…`). **Sub #48 intentionally does NOT edit the
scaffold to fix this** — the scaffolder rule forbids hand-patching output
that the scaffolder should generate. Sub #49 will flip `docsDir`, `locales`,
and the `astro.config.ts` i18n block, and content files will be moved from
the scaffold's `src/content/docs-en/` into `src/content/docs/` plus
`src/content/docs/` starter into `src/content/docs-ja/`.

## Concerns for downstream sub-issues

1. **`cjkFriendly` mismatch**. The preset sets `cjkFriendly: true` and the
   scaffold installs `remark-cjk-friendly`, but the generated
   `src/config/settings.ts` hard-codes `cjkFriendly: false`. The
   `astro.config.ts` gates `remarkCjkFriendly` behind that flag, so the
   plugin is loaded at the npm level but not registered at runtime. Sub #49
   can flip `settings.cjkFriendly` to `true` while porting settings — this
   does **not** need a scaffolder hand-edit here. Worth reporting upstream
   to `zudo-doc` as a preset-to-settings bug.
2. **React vs Preact**. Today's zcss has hand-written React components
   (notably `<CssPreview>` and `<TailwindPreview>`). The scaffold uses
   Preact with `compat: true`, so most React code should transpile
   unchanged, but anything depending on React-specific runtime internals
   (concurrent features, `react-dom/client`, React devtools hooks) needs
   sub-issue attention. Owner: Sub #53 (port custom components).
3. **Astro downgrade**. The re-scaffold effectively downgrades Astro from
   6.0.4 to 5.18.x. This is the zudo-doc-blessed line today. If the team
   prefers to stay on Astro 6, the right path is to bump `zudo-doc` itself
   and re-scaffold, not to hand-edit the output here.
4. **Custom patches**. `patches/astro@6.0.4.patch` will not apply on Astro
   5.18. Sub #57 (misc files) should carry the decision forward — either
   drop the patch, re-target it at 5.18, or defer until the Astro re-bump.
5. **Node types downgrade**. `@types/node` 22 vs 25. Engines remains
   `>=20`, so no runtime break, but TS type surfaces change slightly (e.g.
   `Stream.Duplex` symbol names). Sub-issues that touch Node APIs should
   re-run `pnpm check` after porting.

## Upstream bugs surfaced by codex review

A `/codex-review` pass on the Sub #48 diff flagged three issues inside the
scaffolder output. Per the epic rule _"Do not hand-edit scaffold output to
fix something the scaffolder should generate"_, Sub #48 intentionally does
not patch them. They belong upstream at `zudo-doc` (via
`/refer-another-project -u zudo-doc …`) so a future re-scaffold produces
correct output. Logged here so they are not lost between sub-issues.

- **Breadcrumb trees use the wrong locale.**
  `src/pages/en/docs/[...slug].astro` calls `buildNavTree("ja", …)` and
  `src/pages/docs/[...slug].astro` calls `buildNavTree("en", …)` — so
  English pages build their breadcrumb nav from the Japanese tree and vice
  versa. Clicking a breadcrumb item cross-hops locales. Fix upstream in
  zudo-doc's `templates/base/src/pages/.../[...slug].astro`.
- **`pnpm b4push` referenced but not defined.** The scaffold ships
  `.claude/skills/zudo-doc-version-bump/SKILL.md`, which instructs the
  release workflow to run `pnpm b4push`. The scaffold's `package.json` has
  no `b4push` script, so the skill dead-ends. Fix upstream: either have
  `zudo-doc` emit a `b4push` stub in `package.json` for projects that opt
  into `zudoDocVersionBump`, or soften the skill's hard dependency on that
  script. (zcss already has its own `b4push` pipeline — Sub #54 restores
  it, so zcss itself will be fine post-rebuild; the upstream concern is
  other consumers of the template.)
- **English homepage CTA hardcodes `概要`.**
  `src/pages/en/index.astro` (line ~52) hardcodes the Japanese string
  `概要` as the overview CTA label on the EN landing page. Fix upstream so
  the EN template uses an English label (or threads the label through the
  i18n dictionary). Downstream zcss may replace this page entirely in
  Sub #57, but the upstream bug remains for other consumers.

## Build verification

**Not** run in Sub #48 by design — `/x-wt-teams` rules ban heavy test /
build work in child agents. `pnpm install` succeeded and produced a clean
lockfile, which is enough here. Full `pnpm build` in `__inbox/new-scaffold/`
is the acceptance criterion for Sub #58 (manager-side verification).

## Sub #49 — settings port + URL-shape override

Ported zcss-specific values from the current `src/config/settings.ts`
(pre-rebuild zcss) into `__inbox/new-scaffold/src/config/settings.ts`. The
scaffold's `settings.ts` shape remained the source of truth; only the
values were updated, plus a small set of framework-required fields the
scaffolder did not emit (see "Framework-required settings fields"
below).

### URL-shape override — **EN is the URL default**

The preset ran with `defaultLang: "ja"` (JA is the primary authoring
language for zcss), but zcss's live site keeps **EN as the URL default**
so external links and the `css-wisdom` skill's content references stay
stable:

- EN default: `/pj/zcss/docs/<slug>/`
- JA additional: `/pj/zcss/ja/docs/<slug>/`

To express this, `src/config/settings.ts` uses:

```ts
docsDir: "src/content/docs",              // EN root
locales: { ja: { label: "JA", dir: "src/content/docs-ja" } },
```

And `src/config/i18n.ts` was flipped to keep the runtime helpers
consistent with the URL shape:

```ts
export const defaultLocale = "en" as const;  // was "ja"
// getLocaleLabel default-locale branch returns "EN" (was "JA")
```

Without this, `getContentDir`, `getCollectionName`, and `getLocaleLabel`
would all compute the wrong answers after the astro.config.ts flip.
The scaffolder's template comment on this line already read `always "en"`
(stale from a pre-preset state) — the `"ja"` value was a preset-driven
injection that contradicts the comment; flipping it here restores the
intended documented behaviour.

And `astro.config.ts` was flipped to:

```ts
i18n: {
  defaultLocale: "en",
  locales: ["en", ...Object.keys(settings.locales)],
  routing: { prefixDefaultLocale: false },
},
```

### Known framework mismatch — `src/pages/` hardcoding

**Tracked upstream:** https://github.com/zudolab/zudo-doc/issues/400

The scaffolder bakes the non-default locale's directory name
(`src/pages/en/...`) and internal locale-literal strings (`"ja"` / `"en"`
threaded through `buildNavTree`, `buildBreadcrumbs`, `docsUrl`,
`loadLocaleDocs`, `DocLayout lang=`, `t("…", "ja")`, etc.) at
generation time, driven by the preset's `defaultLang`. With the
URL-shape override applied via `settings.ts` + `astro.config.ts`, the
`src/pages/` directory layout **does not match** the EN-default
intent — it still emits `/en/docs/<slug>/` for the non-default locale
and hardcodes `"ja"` for the default.

Per the epic rule _"Do not hand-edit scaffold output to fix something
the scaffolder should generate"_, Sub #49 intentionally does **not**
rename `src/pages/en/` → `src/pages/ja/` or rewrite the hardcoded
locale literals inside each page. The acceptance gate for Sub #49 is
`pnpm check` (TypeScript); the full URL-parity build is Sub #58 and
will either require a re-scaffold with `defaultLang: "en"` or an
upstream fix in zudo-doc.

Downstream impact: until zudo-doc#400 is resolved (or the repo is
re-scaffolded with `defaultLang: "en"`), the content-migration
sub-issues should move JA content into `src/content/docs-ja/` and EN
content into `src/content/docs/` as the settings now declare, but the
actual URLs produced at build time will still be the scaffold's
default shape. Sub #58 tracks the build-level verification.

### Framework-required settings fields — **upstream bug**

**Tracked upstream:** https://github.com/zudolab/zudo-doc/issues/401

The scaffold's source code references several `settings.*` fields
(`tagPlacement`, `frontmatterPreview`, `tagVocabulary`,
`tagGovernance`, `githubUrl`) in `src/pages/...` and
`src/components/header.astro`, but the scaffolder's default
`settings.ts` does **not** declare them. Without defaults,
`pnpm check` fails with 11 `Property 'X' does not exist` errors on
the fresh scaffold, even before any zcss-specific edits.

Sub #49 adds safe defaults for these fields in the ported
`settings.ts` to keep `pnpm check` green:

```ts
tagPlacement: "after-title" as TagPlacement,
frontmatterPreview: false as FrontmatterPreviewConfig | false,
tagVocabulary: false as TagVocabularyEntry[] | false,
tagGovernance: "off" as TagGovernanceMode,
githubUrl: false as string | false,
```

These are **not** part of the zcss port spec — they are workarounds
for a scaffolder completeness bug. Each declaration is commented in
`settings.ts` with a reference to zudo-doc#401. Once the upstream fix
lands and zcss re-scaffolds, these lines can be dropped (or kept if
zcss wants to customise the values).

### Residual `pnpm check` errors (3 remaining) — **framework bugs**

**Tracked upstream:** https://github.com/zudolab/zudo-doc/issues/404

After the workarounds above, 3 TypeScript errors remain, all inside
scaffold framework source and **not** resolvable via `settings.ts`:

1. `src/components/header.astro:211` — `LanguageSwitcher` passed a
   `locales` prop its `Props` type does not declare.
2. `src/components/frontmatter-preview.astro:76` — `unknown` → `{}`
   assignability mismatch in a JSX slot.
3. `src/components/mermaid-init.astro:53` — `await import("mermaid")`
   fails to resolve because the scaffold does not list `mermaid` in
   `package.json` deps, even though the component is always emitted.

Baseline `pnpm check` on the post-Sub-#48 scaffold (before Sub #49
edits): 16 errors. Post-Sub #49 with workarounds: 3 errors, all
pre-existing and unrelated to the settings port. Sub #49's changes
introduce zero new TypeScript errors.

### Commit-by-commit trail

- `chore(settings): port zcss site identity, color mode, feature flags`
- `chore(settings): force EN-default URL override (docsDir + locales + astro.config.ts i18n)`
- `chore(settings): add framework-required workarounds for zudo-doc#401`
- `docs: record Sub #49 URL-override and workaround rationale in MIGRATION_NOTES`

### Values ported verbatim from the pre-rebuild zcss

- `siteName: "zudo-css-wisdom"`,
  `siteDescription: "Pragmatic CSS knowledge for AI"`,
  `base: "/pj/zcss/"`,
  `siteUrl: "https://takazudomodular.com/pj/zcss/"`.
- `colorScheme: "Default Dark"` with `colorMode` dark-default,
  `respectPrefersColorScheme: true`, `lightScheme: "Default Light"`,
  `darkScheme: "Default Dark"`. Schemes verified present in
  `src/config/color-schemes.ts`.
- `trailingSlash: true`, `editUrl: false`, `docHistory: true`,
  `llmsTxt: true`, `sidebarResizer: true`, `sidebarToggle: true`,
  `docMetainfo: true`, `docTags: false`, `mermaid: false`,
  `math: false`, `noindex: false`, `sitemap: true`,
  `aiAssistant: false`, `colorTweakPanel: false`, `versions: false`,
  `htmlPreview: undefined` (effectively off),
  `claudeResources: { claudeDir: ".claude" }`.
- `cjkFriendly: true` — the preset has `cjkFriendly: true` but the
  scaffold default `settings.ts` ships `cjkFriendly: false`. Flipped
  on here per Sub #48's "Concerns #1".
- `headerNav` — 8 entries verbatim: Overview, Methodology, Layout,
  Typography, Styling, Responsive, Interactive, Claude.
- `footer.links` — one "Fundamentals" column with three items
  (Tight Token Strategy, Component First Strategy, Three-Tier Color
  Strategy), each with JA locale overrides.
- `footer.copyright` — year-stamped HTML string verbatim.
