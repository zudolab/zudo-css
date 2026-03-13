---
name: l-translate
description: >-
  Translate English docs to Japanese for the Docusaurus i18n locale.
  Use when: (1) User wants to translate en docs to ja, (2) User says 'translate',
  'ja version', 'Japanese translation', (3) User wants to check for missing ja docs.
user-invocable: true
argument-hint: "<file-path-or-category> or 'check-missing'"
---

# Translate EN Docs to JA

Translate English MDX documentation files to Japanese using the `ja-translator` subagent.

## Input Parsing

Parse the argument to determine the mode:

- **File path** (e.g., `docs/color/three-tier-color-strategy.mdx`) — translate that specific file
- **Category** (e.g., `color`, `layout`) — translate all untranslated files in that category
- **`check-missing`** or **`check`** — scan for all EN docs without JA counterparts
- **No argument** — ask the user what to translate

## Path Convention

- Source EN: `doc/docs/<category>/<filename>.mdx`
- Target JA: `doc/i18n/ja/docusaurus-plugin-content-docs/current/<category>/<filename>.mdx`

For deep articles (folder with `index.mdx` + sub-pages):
- Source EN: `doc/docs/<category>/<folder>/index.mdx`
- Target JA: `doc/i18n/ja/docusaurus-plugin-content-docs/current/<category>/<folder>/index.mdx`

## Mode A: Translate Specific Files

### Step 1: Identify Files

Resolve the input to one or more source EN file paths. Verify each exists.

### Step 2: Check Existing JA Files

For each source file, check if a JA translation already exists at the i18n path.

- **If JA exists**: Read both EN and JA files. Compare to find sections that differ (the EN may have been updated after the JA was created). Report findings and ask the user whether to update the JA or skip.
- **If JA does not exist**: Proceed to translation.

### Step 3: Translate via Subagent

For each file that needs translation, use the `ja-translator` subagent:

```
Task tool → subagent_type: "ja-translator"
prompt: "Translate <en-path> to Japanese. Write the result to <ja-path>."
```

**Run translations in parallel** when there are multiple independent files.

For updates to existing JA files:

```
Task tool → subagent_type: "ja-translator"
prompt: "Update the Japanese translation at <ja-path> based on changes in <en-path>. Read both files, identify what changed in the EN source, and update only the corresponding sections in the JA file."
```

### Step 4: Handle `_category_.json`

If the translated file is in a category directory that doesn't have a `_category_.json` in the JA i18n path, check if one exists in the EN source and copy it with translated `label` and `description` fields.

### Step 5: Validate

Run `pnpm build` from `doc/` to verify no broken links or MDX errors.

### Step 6: Report

List all translated files and their output paths.

## Mode B: Check Missing Translations

### Step 1: Scan EN Docs

List all `.mdx` files under `doc/docs/` (recursively).

### Step 2: Compare with JA Docs

For each EN file, check if a corresponding file exists at `doc/i18n/ja/docusaurus-plugin-content-docs/current/`.

### Step 3: Report

Output a table of missing JA translations grouped by category:

```
| Category | File | Status |
|----------|------|--------|
| color | three-tier-color-strategy.mdx | MISSING |
| visual | gradient-techniques/index.mdx | EXISTS |
```

### Step 4: Offer to Translate

Ask the user if they want to translate the missing files (all at once or selectively).

## Mode C: Translate Category

Same as Mode A but for all untranslated files in a given category directory.

### Step 1: List EN Files in Category

```bash
ls doc/docs/<category>/
```

### Step 2: Filter to Missing

Compare with `doc/i18n/ja/docusaurus-plugin-content-docs/current/<category>/` and identify files without JA counterparts.

### Step 3: Translate All Missing

Run parallel `ja-translator` subagent tasks for all missing files.

## Notes

- The `ja-translator` agent handles all translation rules (what to translate vs keep in English, technical term glossing, writing style, etc.)
- Always preserve the exact file name — only the directory path changes
- CssPreview/TailwindPreview `title` props get translated; `html`/`css`/`height` props stay as-is
- Code blocks stay entirely in English
- After translation, the user should visually verify the JA page renders correctly
