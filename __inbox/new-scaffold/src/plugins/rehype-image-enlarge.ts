import type { Root, Element, ElementContent } from "hast";
import { visit, SKIP } from "unist-util-visit";

function isWhitespaceText(node: ElementContent): boolean {
  return node.type === "text" && node.value.trim() === "";
}

function isEnlargeableFigure(node: ElementContent): boolean {
  if (node.type !== "element" || node.tagName !== "figure") return false;
  const cls = node.properties?.className;
  return Array.isArray(cls) && cls.includes("zd-enlargeable");
}

function makeEnlargeButton(): Element {
  return {
    type: "element",
    tagName: "button",
    properties: {
      type: "button",
      className: ["zd-enlarge-btn"],
      ariaLabel: "Enlarge image",
      hidden: true,
    },
    children: [
      {
        type: "element",
        tagName: "svg",
        properties: {
          viewBox: "0 0 38.99 38.99",
          fill: "currentColor",
          focusable: "false",
          ariaHidden: true,
        },
        children: [
          {
            type: "element",
            tagName: "polygon",
            properties: {
              points:
                "16.2 13.74 5.92 3.47 11.2 3.47 11.2 0 3.47 0 0 0 0 3.47 0 11.2 3.47 11.2 3.47 5.92 13.74 16.2 16.2 13.74",
            },
            children: [],
          },
          {
            type: "element",
            tagName: "polygon",
            properties: {
              points:
                "25.24 16.2 35.52 5.92 35.52 11.2 38.99 11.2 38.99 3.47 38.99 0 35.52 0 27.79 0 27.79 3.47 33.07 3.47 22.79 13.74 25.24 16.2",
            },
            children: [],
          },
          {
            type: "element",
            tagName: "polygon",
            properties: {
              points:
                "22.79 25.24 33.07 35.52 27.79 35.52 27.79 38.99 35.52 38.99 38.99 38.99 38.99 35.52 38.99 27.79 35.52 27.79 35.52 33.07 25.24 22.79 22.79 25.24",
            },
            children: [],
          },
          {
            type: "element",
            tagName: "polygon",
            properties: {
              points:
                "13.74 22.79 3.47 33.07 3.47 27.79 0 27.79 0 35.52 0 38.99 3.47 38.99 11.2 38.99 11.2 35.52 5.92 35.52 16.2 25.24 13.74 22.79",
            },
            children: [],
          },
        ],
      },
    ],
  };
}

export function rehypeImageEnlarge() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "p" || !parent || index === undefined) return;

      const nonWs = node.children.filter((c) => !isWhitespaceText(c));

      // Idempotency: <p> already contains a wrapped figure
      if (nonWs.length === 1 && isEnlargeableFigure(nonWs[0])) return SKIP;

      // Case A requires exactly one non-whitespace child that is <img>
      if (nonWs.length !== 1) return;
      const child = nonWs[0];
      if (child.type !== "element" || child.tagName !== "img") return;

      const imgEl = child;

      // Opt-out: exact title="no-enlarge" — skip wrap but remove title attr
      if (imgEl.properties?.title === "no-enlarge") {
        const newProps = { ...imgEl.properties };
        delete newProps.title;
        imgEl.properties = newProps;
        return SKIP;
      }

      const figureEl: Element = {
        type: "element",
        tagName: "figure",
        properties: { className: ["zd-enlargeable"] },
        children: [imgEl, makeEnlargeButton()],
      };

      (parent as Element).children[index] = figureEl;
      return SKIP;
    });
  };
}
