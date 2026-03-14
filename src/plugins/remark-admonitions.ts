import type { Root } from "mdast";
import { visit, SKIP } from "unist-util-visit";

/**
 * Remark plugin that transforms container directives (`:::note`, `:::info`,
 * etc., parsed by remark-directive) into JSX component nodes (`<Note>`,
 * `<Info>`, etc.) that Astro MDX resolves via the `components` prop.
 *
 * Requires remark-directive to run before this plugin.
 *
 * Usage in MDX:
 *   :::note[Custom Title]
 *   Content here.
 *   :::
 *
 *   :::note
 *   Content without custom title.
 *   :::
 */

const ADMONITION_TYPES = new Set(["note", "tip", "info", "warning", "danger"]);

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Recursively extract plain text from an mdast node tree. */
function extractText(node: any): string {
  if (typeof node.value === "string") return node.value;
  if (Array.isArray(node.children)) {
    return node.children.map(extractText).join("");
  }
  return "";
}

export function remarkAdmonitions() {
  return (tree: Root) => {
    visit(tree, (node: any) => {
      if (
        node.type === "containerDirective" &&
        ADMONITION_TYPES.has(node.name)
      ) {
        const componentName = capitalize(node.name);

        // Extract title from the directive label
        const label = node.children?.[0];
        const isLabel = label?.data?.directiveLabel === true;
        const title = isLabel ? extractText(label) : "";

        // Build JSX attributes
        const attributes: any[] = [];
        if (title) {
          attributes.push({
            type: "mdxJsxAttribute",
            name: "title",
            value: title,
          });
        }

        // Replace the node in-place with an mdxJsxFlowElement
        node.type = "mdxJsxFlowElement";
        node.name = componentName;
        node.attributes = attributes;
        delete node.data;

        // Remove the label paragraph from children if consumed as title
        if (isLabel) {
          node.children = node.children.slice(1);
        }

        return SKIP;
      }
    });
  };
}
