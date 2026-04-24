# zudo-doc rebuild of zcss — migration notes

Tracks decisions, deltas, and upstream bugs for epic zudolab/zudo-css-wisdom#47.

## Preset

File: `__inbox/zcss-preset.json`

```json
{
  "projectName": "zudo-css-wisdom",
  "defaultLang": "en",
  "colorSchemeMode": "light-dark",
  "lightScheme": "Default Light",
  "darkScheme": "Default Dark",
  "defaultMode": "dark",
  "respectPrefersColorScheme": true,
  "features": [
    "search", "sidebarFilter", "i18n", "claudeResources", "claudeSkills",
    "sidebarResizer", "sidebarToggle", "docHistory", "llmsTxt",
    "skillSymlinker", "tauri", "footerNavGroup", "footerCopyright"
  ],
  "cjkFriendly": true,
  "packageManager": "pnpm"
}
```

### `defaultLang` pivot (manager-level decision)

The original epic preset (in the issue body) had `defaultLang: "ja"` and a post-hoc "URL override" layered on top to flip URL defaults back to EN. During Sub #49 implementation, upstream issue zudolab/zudo-doc#400 surfaced: the scaffolder bakes `defaultLang` into `src/pages/<non-default-locale>/` directory names and internal locale literal strings, so settings.ts cannot override the URL shape after the fact.

**Pivot**: change the preset's `defaultLang` to `"en"`. The scaffolder then produces the correct URL shape natively (EN at `/docs/`, JA at `/ja/docs/`) without any override. This is a strict improvement over the epic's original plan — simpler, no impedance mismatch, less work in Sub #49.

Trade-off: the preset's `defaultLang` no longer reflects the authoring-source language preference (JA was the historical origin). This is a semantic mismatch for the preset, but the preset's role is to drive scaffolding, not to document authoring history. The rebuild makes EN the URL default, which matches the live production site.

Upstream issue zudolab/zudo-doc#400 stays open as a real framework bug — it will affect other consumers who genuinely need a post-hoc default-locale flip.

## Scaffold version snapshot

Generated via:
```
node /Users/takazudo/repos/myoss/zudo-doc/packages/create-zudo-doc/dist/index.js \
  --preset ./zcss-preset.json --name new-scaffold --no-install
```

Then `pnpm install --ignore-workspace --prefer-offline` inside `__inbox/new-scaffold/` to produce `pnpm-lock.yaml`.

### Top-level dependency delta (scaffold vs pre-rebuild zcss)

| Package | zcss pre-rebuild | scaffold | Change |
|---------|------------------|----------|--------|
| astro | ^6.0.4 | ^5.18.0 | DOWN (major) |
| @astrojs/mdx | ^5.0.0 | ^4.3.0 | DOWN (major) |
| @astrojs/react | ^4.0.0 | — | REMOVED |
| @astrojs/preact | — | ^4.x | NEW |
| react + react-dom | ^18.x | — | REMOVED |
| preact | — | ^10.x | NEW |
| shiki + @shikijs/transformers | — | — | REMOVED (pagefind-based search) |
| pagefind | — | ^1.x | NEW |
| remark-cjk-friendly | — | ^2.x | NEW (from cjkFriendly: true) |
| remark-directive | ^4.0.0 | ^3.0.0 | DOWN (major) |
| @types/node | ^25.3.5 | ^22.0.0 | DOWN (major, still within engines >=20) |
| lefthook + prettier + prettier-plugin-astro + vitest | present | — | REMOVED |

## Scaffold templates used

- `templates/base/` — core layer.
- `templates/features/i18n/` — applied because preset included `"i18n"`.
- `templates/features/search/`, `sidebarFilter/`, `claudeResources/`, `claudeSkills/`, `sidebarResizer/`, `sidebarToggle/`, `docHistory/`, `llmsTxt/`, `skillSymlinker/`, `tauri/`, `footerNavGroup/`, `footerCopyright/` — each applied per preset.

## Applied preset features

All 13 features in the preset were applied. See `__inbox/new-scaffold/package.json` + `src/integrations/` for the resulting integrations.

## Upstream zudo-doc bugs surfaced during this rebuild

| Issue | Title | Impact on this rebuild |
|---|---|---|
| zudolab/zudo-doc#393 | breadcrumb trees on `src/pages/<locale>/docs/[...slug].astro` use the wrong locale | Will still manifest once content lands; cross-locale breadcrumb hops on click. Non-blocking for URL parity. |
| zudolab/zudo-doc#395 | `zudo-doc-version-bump` skill references non-existent `pnpm b4push` script | zcss has its own b4push; no impact. |
| zudolab/zudo-doc#397 | `src/pages/en/index.astro` hardcodes 概要 as overview CTA label | With `defaultLang: "en"` there is no `src/pages/en/` dir, but the source template still has the bug for other consumers. Currently the EN landing is `src/pages/index.astro`; the JA landing `src/pages/ja/index.astro` may have the mirror bug (English literal on a JA page). To verify during Sub #58. |
| zudolab/zudo-doc#399 | preset `cjkFriendly: true` does not propagate to `settings.ts` | Hand-flip `cjkFriendly: true` in settings.ts when porting (Sub #49 equivalent). |
| zudolab/zudo-doc#400 | scaffolder bakes defaultLang into `src/pages/` directory names and locale literals | Worked around by changing preset `defaultLang` to `"en"` (the pivot above). |
| zudolab/zudo-doc#401 | scaffold source references 5 settings fields not declared in default `settings.ts` (tagPlacement, frontmatterPreview, tagVocabulary, tagGovernance, githubUrl) | Causes 11 out-of-the-box `pnpm check` errors. Workaround: declare stubs in zcss settings.ts. |
| zudolab/zudo-doc#402 | scaffold `.gitignore` missing `.DS_Store`, `.env`, `*.log`, `.wrangler` | Merged in by Sub #57 equivalent when porting `.gitignore`. |
| zudolab/zudo-doc#403 | `settings.githubUrl` undeclared, `LanguageSwitcher` rejects locales prop, mermaid dep missing | Post-Sub #49 residual TS errors. |
| zudolab/zudo-doc#404 | LanguageSwitcher prop, frontmatter-preview unknown-JSX, missing mermaid dep | Residual from the scaffolder; non-blocking for URL parity. |

## Sub #54 script decisions

Phase 3 port of zcss custom scripts and package.json wiring (issue
zudolab/zudo-css-wisdom#54). Landed in worktree
`zudo-doc-rebuild/sub54-scripts`.

Ported into `__inbox/new-scaffold/scripts/`:

| Script | Notes |
|---|---|
| `check-links.js` | Post-build link checker, `--strict` mode used by `pnpm check:links`. |
| `dev-stable.js` | Build-then-serve fallback dev mode. Not referenced from package.json; kept as a manual utility (`node scripts/dev-stable.js`) because the scaffold ships no equivalent. |
| `generate-css-wisdom.js` | Regenerates `.claude/skills/css-wisdom/SKILL.md` from `descriptions.json`. Driven by `pnpm generate:css-wisdom`. |
| `run-b4push.sh` | Pre-push orchestrator (typecheck + build + link check). Driven by `pnpm b4push`. |
| `version-bump.sh` | Release helper. Not wired into `package.json`; invoked manually (`./scripts/version-bump.sh …`). |
| `__tests__/check-links.test.ts` | Unit tests for `check-links.js`. `vitest.config.ts` currently only scans `e2e/`, so these tests are not yet included by `pnpm test`; widening the include pattern is Sub #58 territory. |

Deliberately NOT ported:

- **zcss's `scripts/setup-doc-skill.sh`** — superseded. zcss's own
  `package.json` no longer calls this file (the live `setup:doc-skill`
  entry is an inline `node … && ln -sfn …`). It was legacy/dead in
  zcss already, so porting it would be importing stale code.
- **`scripts/__tests__/setup-doc-skill.test.ts`** — its subject
  (`setup-doc-skill.sh`) is not in the port, so the test would be
  dangling. Also, the test's expected doc-category tree (`getting-started/`,
  `guides/`, `reference/`, `components/`) does not match zcss's actual
  tree (`layout/`, `typography/`, `styling/`, …) and would fail against
  the live content.

Deleted from the scaffold:

- **`__inbox/new-scaffold/scripts/setup-doc-skill.sh`** (provided by
  the `skillSymlinker` feature). The scaffold's version generates a
  generic SKILL.md templated for `<HtmlPreview>` demos and a
  project-name-derived skill name (`new-scaffold-wisdom`). zcss's
  SKILL.md is curated via `generate-css-wisdom.js` + a static
  `descriptions.json`, and demos use `<CssPreview>`, so the scaffold
  script would produce the wrong shape. `setup:doc-skill` in
  `package.json` is overridden to point at zcss's inline
  generate-and-symlink flow instead.

`package.json` merge result (scripts section):

- Added: `predev`, `dev` (with `--port 8811 --host css-bp.localhost`),
  `dev:network`, `check:links`, `b4push`, `generate:css-wisdom`.
- Overridden: `setup:doc-skill` (see above).
- Left untouched (scaffold defaults): `build`, `preview`, `check`,
  `dev:tauri`, `build:tauri`. Overriding `check` (`astro check` →
  `astro sync && tsc --noEmit` in zcss) and `preview` (`--port 8811`
  in zcss) is out of Sub #54 scope; Sub #58 can revisit if actually
  needed.

No new zudo-doc upstream issues surfaced by this port.

## Concerns for downstream

- `patches/astro@6.0.4.patch` will not apply on astro 5.18. Sub #57 equivalent decides drop/retarget/defer.
- React → Preact switch. Sub #53 equivalent must verify `<CssPreview>` and `<TailwindPreview>` work under Preact compat. Empirically the current CssPreview only uses `ReactNode` type + `useMemo`, which Preact handles fine.
- `__inbox/` .gitignore adjusted so `__inbox/new-scaffold/` content tracks but `node_modules/dist/.astro/.output/.wrangler/.playwright-cli/.DS_Store` inside the scaffold stays ignored.
