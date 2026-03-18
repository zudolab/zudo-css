#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────
# version-bump.sh — Bump version, create changelog entry,
#                    and optionally snapshot docs
# ─────────────────────────────────────────────────────────────
#
# Usage:
#   ./scripts/version-bump.sh <new-version> [--snapshot]
#
# Examples:
#   ./scripts/version-bump.sh 0.2.0
#   ./scripts/version-bump.sh 1.0.0 --snapshot
#
# What it does:
#   1. Updates the version in package.json
#   2. Creates a changelog entry MDX file (EN + JA)
#   3. With --snapshot: copies current docs to a versioned directory
#      and adds the OLD version to settings.ts versions array
# ─────────────────────────────────────────────────────────────

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# ── Parse arguments ──────────────────────────────────────────

if [ $# -lt 1 ]; then
  echo "Usage: $0 <new-version> [--snapshot]"
  echo ""
  echo "Options:"
  echo "  --snapshot   Archive current docs as a versioned snapshot before bumping"
  echo ""
  echo "Examples:"
  echo "  $0 0.2.0              # Bump version + create changelog entry"
  echo "  $0 1.0.0 --snapshot   # Also snapshot current docs as old version"
  exit 1
fi

NEW_VERSION="$1"
SNAPSHOT=false

if [ "${2:-}" = "--snapshot" ]; then
  SNAPSHOT=true
fi

# Validate version format (semver-like: digits.digits.digits with optional pre-release)
if ! echo "$NEW_VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$'; then
  echo "Error: Version must be in semver format (e.g., 0.2.0, 1.0.0)"
  exit 1
fi

# ── Read current version ─────────────────────────────────────

OLD_VERSION=$(node -p "require('$ROOT_DIR/package.json').version" 2>/dev/null)
echo "Current version: $OLD_VERSION"
echo "New version:     $NEW_VERSION"

if [ "$OLD_VERSION" = "$NEW_VERSION" ]; then
  echo "Error: New version is the same as the current version"
  exit 1
fi

# ── Step 1: Bump package.json version ────────────────────────

echo ""
echo "▶ Updating package.json version..."
node -e "
  const fs = require('fs');
  const pkgPath = '$ROOT_DIR/package.json';
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  pkg.version = '$NEW_VERSION';
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
"
echo "  ✓ package.json updated to $NEW_VERSION"

# ── Step 2: Create changelog entry ───────────────────────────

CHANGELOG_DIR="$ROOT_DIR/src/content/docs/changelog"
CHANGELOG_JA_DIR="$ROOT_DIR/src/content/docs-ja/changelog"

# Determine sidebar_position: count existing .mdx files (excluding index.mdx)
# Use high values for descending sort (newest first). Index page uses position 10.
EXISTING_COUNT=$(find "$CHANGELOG_DIR" -maxdepth 1 -name '*.mdx' ! -name 'index.mdx' 2>/dev/null | wc -l | tr -d ' ')
SIDEBAR_POS=$((1000 + EXISTING_COUNT + 1))

CHANGELOG_FILE="$CHANGELOG_DIR/$NEW_VERSION.mdx"
CHANGELOG_JA_FILE="$CHANGELOG_JA_DIR/$NEW_VERSION.mdx"

if [ -f "$CHANGELOG_FILE" ]; then
  echo "Warning: $CHANGELOG_FILE already exists, skipping changelog creation"
else
  echo ""
  echo "▶ Creating changelog entry..."

  mkdir -p "$CHANGELOG_DIR"
  mkdir -p "$CHANGELOG_JA_DIR"

  cat > "$CHANGELOG_FILE" << MDXEOF
---
title: $NEW_VERSION
description: Release notes for $NEW_VERSION.
sidebar_position: $SIDEBAR_POS
---

<!-- Add release notes here -->

### Features

- <!-- Describe new features -->

### Bug Fixes

- <!-- Describe bug fixes -->
MDXEOF
  echo "  ✓ Created $CHANGELOG_FILE (sidebar_position: $SIDEBAR_POS)"

  cat > "$CHANGELOG_JA_FILE" << MDXEOF
---
title: $NEW_VERSION
description: ${NEW_VERSION}のリリースノート。
sidebar_position: $SIDEBAR_POS
---

<!-- リリースノートをここに追加 -->

### 機能

- <!-- 新機能を記述 -->

### バグ修正

- <!-- バグ修正を記述 -->
MDXEOF
  echo "  ✓ Created $CHANGELOG_JA_FILE"
fi

# ── Step 3 (optional): Snapshot docs ─────────────────────────

if [ "$SNAPSHOT" = true ]; then
  echo ""
  echo "▶ Snapshotting current docs as version $OLD_VERSION..."

  # Derive slug from old version (e.g., "0.0.1" → "0.0")
  OLD_SLUG=$(echo "$OLD_VERSION" | sed 's/\.[0-9]*$//')

  SNAPSHOT_DIR="$ROOT_DIR/src/content/docs-v${OLD_SLUG}"
  SNAPSHOT_JA_DIR="$ROOT_DIR/src/content/docs-v${OLD_SLUG}-ja"

  if [ -d "$SNAPSHOT_DIR" ]; then
    echo "  Warning: $SNAPSHOT_DIR already exists, skipping snapshot"
  else
    cp -r "$ROOT_DIR/src/content/docs" "$SNAPSHOT_DIR"
    echo "  ✓ Copied docs → docs-v${OLD_SLUG}"

    if [ -d "$ROOT_DIR/src/content/docs-ja" ]; then
      cp -r "$ROOT_DIR/src/content/docs-ja" "$SNAPSHOT_JA_DIR"
      echo "  ✓ Copied docs-ja → docs-v${OLD_SLUG}-ja"
    fi

    # Add version entry to settings.ts
    echo ""
    echo "▶ Updating settings.ts versions array..."
    echo ""
    echo "  ⚠  Please add the following entry to the 'versions' array in"
    echo "     src/config/settings.ts:"
    echo ""
    echo "    {"
    echo "      slug: \"${OLD_SLUG}\","
    echo "      label: \"${OLD_VERSION}\","
    echo "      docsDir: \"src/content/docs-v${OLD_SLUG}\","
    echo "      locales: {"
    echo "        ja: { dir: \"src/content/docs-v${OLD_SLUG}-ja\" },"
    echo "      },"
    echo "      banner: \"unmaintained\","
    echo "    },"
    echo ""
    echo "  This step requires manual editing to avoid breaking the TypeScript file."
  fi
fi

# ── Summary ──────────────────────────────────────────────────

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Done! Version bumped to $NEW_VERSION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "  1. Edit the changelog entry: src/content/docs/changelog/$NEW_VERSION.mdx"
echo "  2. Edit the Japanese mirror: src/content/docs-ja/changelog/$NEW_VERSION.mdx"
if [ "$SNAPSHOT" = true ]; then
  echo "  3. Add the version entry to src/config/settings.ts (see above)"
fi
echo "  4. Commit the changes"
