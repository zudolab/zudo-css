---
name: zudo-doc-version-bump
description: >-
  Bump package version, generate changelog docs, commit, tag, and create GitHub release. Use when:
  (1) User says 'version bump', 'bump version', 'release', or 'zudo-doc-version-bump', (2) User
  wants to create a new release of this project.
user-invocable: true
disable-model-invocation: true
argument-description: "Optional: major, minor, or patch to skip the proposal step"
---

# /zudo-doc-version-bump

Bump the version, generate changelog doc pages, commit, tag, and create a GitHub release.

## Preconditions

Before doing anything else, verify ALL of the following. If any check fails, stop and tell the user.

1. Current branch is `main`
2. Working tree is clean (`git status --porcelain` returns empty)
3. At least one `v*` tag exists (`git tag -l 'v*'`). If no tag exists, tell the user to create the initial tag first (e.g. `git tag v0.1.0 && git push --tags`).

Find the latest version tag:

```bash
git tag -l 'v*' --sort=-v:refname | head -1
```

## Analyze changes since last tag

Run:

```bash
git log <last-tag>..HEAD --oneline
```

and

```bash
git diff <last-tag>..HEAD --stat
```

Categorize each commit by its conventional-commit prefix:

- **Breaking Changes**: commits with an exclamation mark suffix (e.g. `feat!:`) or BREAKING CHANGE in body
- **Features**: `feat:` prefix
- **Bug Fixes**: `fix:` prefix
- **Other Changes**: everything else (`docs:`, `chore:`, `refactor:`, `ci:`, `test:`, `style:`, `perf:`, etc.)

## Propose version bump

Based on the changes:

- If there are breaking changes → propose **major** bump
- If there are features (no breaking) → propose **minor** bump
- Otherwise → propose **patch** bump

If the user passed an argument (`major`, `minor`, or `patch`), use that directly instead of proposing.

Present the proposal to the user:

```
Proposed bump: {current} → {new} ({type})

Breaking Changes:
- description (hash)

Features:
- description (hash)

Bug Fixes:
- description (hash)

Other Changes:
- description (hash)
```

Only show sections that have entries. **Wait for user confirmation before proceeding.**

If this is a **major** version bump, ask the user whether they want to archive the current docs as a versioned snapshot (i.e. run with `--snapshot`). Explain that this copies the current docs to a versioned directory for the old version.

## Run version-bump.sh

Run the existing version bump script to update package.json and create changelog entry files:

```bash
./scripts/version-bump.sh {NEW_VERSION}
# Or with snapshot for major bumps:
./scripts/version-bump.sh {NEW_VERSION} --snapshot
```

This script:

1. Updates `version` in `package.json`
2. Creates `src/content/docs/changelog/{NEW_VERSION}.mdx` (EN)
3. Creates `src/content/docs-ja/changelog/{NEW_VERSION}.mdx` (JA)
4. With `--snapshot`: copies current docs to versioned directories and prints settings.ts entry to add

## Fill in changelog content

After the script creates the template files, **replace the placeholder content** with the actual categorized changes from the commit analysis.

### English changelog (`src/content/docs/changelog/{NEW_VERSION}.mdx`)

```mdx
---
title: {NEW_VERSION}
description: Release notes for {NEW_VERSION}.
sidebar_position: {value from script}
---

Released: {YYYY-MM-DD}

### Breaking Changes

- Description (commit-hash)

### Features

- Description (commit-hash)

### Bug Fixes

- Description (commit-hash)

### Other Changes

- Description (commit-hash)
```

### Japanese changelog (`src/content/docs-ja/changelog/{NEW_VERSION}.mdx`)

```mdx
---
title: {NEW_VERSION}
description: {NEW_VERSION}のリリースノート。
sidebar_position: {value from script}
---

リリース日: {YYYY-MM-DD}

### 破壊的変更

- Description (commit-hash)

### 機能

- Description (commit-hash)

### バグ修正

- Description (commit-hash)

### その他の変更

- Description (commit-hash)
```

Rules:

- Only include sections that have entries
- Use today's date for the release date
- Each entry should be the commit subject with the short hash in parentheses

## Build and test

Run the full build and test suite to make sure everything is good:

```bash
pnpm b4push
```

If anything fails, fix the issue and re-run. Do not proceed with committing until all checks pass.

## Commit changes

Stage and commit **all** version bump changes — include any files modified by b4push formatting fixes:

```bash
git add package.json src/content/docs/changelog/{NEW_VERSION}.mdx src/content/docs-ja/changelog/{NEW_VERSION}.mdx
# Also stage any other modified files (e.g. formatting fixes from b4push)
git diff --name-only | xargs git add
git commit -m "chore: Bump version to v{NEW_VERSION}"
```

## Push and wait for CI

Push the commits first (without the tag) and wait for CI to pass:

```bash
git push
```

Then check CI status. Use `gh run list --branch main --limit 1 --json status,conclusion,headSha` and verify the `headSha` matches the pushed commit. Poll every 30 seconds, with a **maximum of 10 minutes**. If CI is still running after 10 minutes, ask the user whether to keep waiting or proceed.

If CI fails, investigate the failure with `gh run view <run-id> --log-failed`, fix the issue, commit, and push again.

**Do not tag or publish until CI is green.**

## Tag, push tag, and create GitHub release

**Ask the user for confirmation before tagging.**

```bash
git tag v{NEW_VERSION}
git push --tags
```

After pushing the tag, create a GitHub release. Use `awk` to strip only the YAML frontmatter (first `---` to second `---`) from the changelog file:

```bash
NOTES=$(awk 'BEGIN{f=0} /^---$/{f++; next} f>=2' src/content/docs/changelog/{NEW_VERSION}.mdx)
gh release create v{NEW_VERSION} --title "v{NEW_VERSION}" --notes "$NOTES"
```

## Publish to npm (if applicable)

If the package is **not** marked as `"private": true` in `package.json`, tell the user to publish:

```
The package is ready for npm publishing. Run:

  pnpm publish

(This requires browser-based 2FA and must be done manually.)
```

If the package is `"private": true`, skip this step and inform the user:

```
Package is marked as private — skipping npm publish.
```

## Done

Report the summary:

- Version bumped: `{OLD_VERSION}` → `{NEW_VERSION}`
- Changelog created (EN + JA)
- Git tag: `v{NEW_VERSION}`
- GitHub release: link to the release
- npm publish status (published / skipped for private package)
