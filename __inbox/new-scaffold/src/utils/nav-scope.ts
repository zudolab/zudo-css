import { settings } from "@/config/settings";
import type { NavNode } from "@/utils/docs";
export type { HeaderNavItem } from "@/config/settings";

/** Collect all categoryMatch strings from headerNav, including children (ordered). */
export function getCategoryOrder(): string[] {
  return settings.headerNav.flatMap((item) => {
    const matches: string[] = [];
    if (item.categoryMatch) matches.push(item.categoryMatch);
    if (item.children) {
      for (const child of item.children) {
        if (child.categoryMatch) matches.push(child.categoryMatch);
      }
    }
    return matches;
  });
}

/**
 * Given a doc's slug (e.g. "getting-started/introduction" or "claude-agents/doc-reviewer"),
 * return the categoryMatch value of the headerNav item it belongs to.
 */
export function getNavSectionForSlug(slug: string): string | undefined {
  const topCategory = slug.split("/")[0] ?? "";
  const all = getCategoryOrder();

  // First pass: find explicit matchers (not "!")
  const explicitMatches = all.filter(
    (cm) => cm !== "!" && topCategory.startsWith(cm),
  );
  if (explicitMatches.length > 0) {
    // Longest prefix match wins
    return explicitMatches.sort((a, b) => b.length - a.length)[0];
  }

  // Second pass: return the default ("!") matcher
  const defaultItem = settings.headerNav.find(
    (item) => item.categoryMatch === "!",
  );
  return defaultItem?.categoryMatch;
}

/**
 * Filter top-level NavNodes by a headerNav categoryMatch value.
 * - "!" means everything NOT claimed by explicit matchers
 * - "claude" means nodes whose slug starts with "claude"
 * - undefined means all nodes
 */
export function getNavSubtree(
  tree: NavNode[],
  categoryMatch?: string,
): NavNode[] {
  if (!categoryMatch) return tree;

  if (categoryMatch === "!") {
    const explicitPrefixes = getCategoryOrder().filter((cm) => cm !== "!");
    return tree.filter(
      (node) => !explicitPrefixes.some((prefix) => node.slug.startsWith(prefix)),
    );
  }

  return tree.filter((node) => node.slug.startsWith(categoryMatch));
}
