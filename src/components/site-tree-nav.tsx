import { useState } from "react";
import type { NavNode } from "@/utils/docs";
import { INDENT, connectorLeft, ConnectorLines } from "./tree-nav-shared";

function CategoryLinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 103.395 107.049"
      aria-hidden="true"
      className="w-[18px] 2xl:w-[24px] shrink-0"
    >
      <path d="M5.746 5.74 0 11.49l20.987 20.96C34.126 45.572 41.963 53.45 41.948 53.523c-.012.062-9.456 9.544-20.986 21.07L0 95.55l5.714 5.715c3.142 3.143 5.748 5.715 5.79 5.715s2.63-2.563 5.75-5.696l17.939-18.001c21.867-21.94 29.443-29.599 29.443-29.768 0-.114-.665-.804-5.084-5.275C51.872 40.47 11.71.125 11.565.036 11.525.01 8.906 2.578 5.746 5.74m38.345-.066c-3.132 3.13-5.696 5.71-5.696 5.732-.001.022 2.16 2.185 4.8 4.807 2.641 2.623 8.382 8.338 12.758 12.702 15.38 15.337 23.763 23.641 24.314 24.086.19.153.346.336.346.405 0 .07-1.738 1.847-3.887 3.976a17515 17515 0 0 0-20.35 20.264 19555 19555 0 0 1-17.223 17.158c-.416.409-.757.77-.757.8 0 .083 11.415 11.485 11.457 11.445.235-.22 53.542-53.528 53.542-53.543C103.395 53.472 49.891.02 49.837 0c-.028-.01-2.613 2.543-5.746 5.674" />
    </svg>
  );
}

// site-tree-nav uses wider padding than the narrow sidebar
const SITE_BASE_PAD = "clamp(0.8rem, 1.5vw, 1.8rem)";

function padLeft(depth: number): string {
  if (depth === 0) return SITE_BASE_PAD;
  return `calc(${depth} * ${INDENT} + 1.25rem + 5px)`;
}

function reorderTree(tree: NavNode[], order: string[]): NavNode[] {
  const map = new Map(tree.map((node) => [node.slug, node]));
  const ordered: NavNode[] = [];
  for (const slug of order) {
    const node = map.get(slug);
    if (node) {
      ordered.push(node);
      map.delete(slug);
    }
  }
  // append unmatched nodes at end
  for (const node of map.values()) {
    ordered.push(node);
  }
  return ordered;
}

interface SiteTreeNavProps {
  tree: NavNode[];
  ariaLabel?: string;
  categoryOrder?: string[];
  categoryIgnore?: string[];
}

export default function SiteTreeNav({
  tree,
  ariaLabel = "Site index",
  categoryOrder,
  categoryIgnore,
}: SiteTreeNavProps) {
  let processedTree = tree;
  if (categoryIgnore) {
    const ignoreSet = new Set(categoryIgnore);
    processedTree = processedTree.filter((node) => !ignoreSet.has(node.slug));
  }
  if (categoryOrder) {
    processedTree = reorderTree(processedTree, categoryOrder);
  }
  return (
    <nav
      aria-label={ariaLabel}
      className="grid gap-vsp-md"
      style={{
        gridTemplateColumns: "repeat(auto-fill, minmax(min(18rem, 100%), 1fr))",
      }}
    >
      {processedTree.map((node) => (
        <div key={node.slug} className="min-w-0 border border-muted">
          {node.children.length > 0 ? (
            <CategoryNode node={node} depth={0} isLast={true} />
          ) : (
            <LeafNode node={node} depth={0} isLast={true} />
          )}
        </div>
      ))}
    </nav>
  );
}

function NodeList({ nodes, depth }: { nodes: NavNode[]; depth: number }) {
  return (
    <>
      {nodes.map((node, index) => {
        const isLast = index === nodes.length - 1;
        return node.children.length > 0 ? (
          <CategoryNode
            key={node.slug}
            node={node}
            depth={depth}
            isLast={isLast}
          />
        ) : (
          <LeafNode
            key={node.slug}
            node={node}
            depth={depth}
            isLast={isLast}
          />
        );
      })}
    </>
  );
}

function CategoryNode({
  node,
  depth,
  isLast,
}: {
  node: NavNode;
  depth: number;
  isLast: boolean;
}) {
  const [open, setOpen] = useState(true);
  const toggle = () => setOpen((prev) => !prev);
  const paddingLeft = padLeft(depth);

  return (
    <div className={`${depth >= 1 && !isLast ? "relative" : ""}`}>
      {depth >= 1 && !isLast && open && (
        <div
          className="absolute border-l border-solid border-muted z-10"
          style={{
            left: connectorLeft(depth),
            top: 0,
            bottom: 0,
          }}
        />
      )}
      <div className="relative">
        <ConnectorLines depth={depth} isLast={isLast} />
        <div
          className="flex w-full items-center justify-between text-small font-semibold py-[0.15rem] text-fg"
          style={{ paddingLeft }}
        >
          {node.href ? (
            <a
              href={node.href}
              className="flex-1 flex items-center gap-hsp-xs py-vsp-xs text-fg hover:text-accent hover:underline focus:underline"
            >
              {depth === 0 && <CategoryLinkIcon />}
              {node.label}
            </a>
          ) : (
            <button
              type="button"
              onClick={toggle}
              className="flex-1 py-vsp-xs text-left hover:text-accent hover:underline focus:underline"
            >
              {node.label}
            </button>
          )}
          <button
            type="button"
            onClick={toggle}
            className="aspect-square flex items-center justify-center w-[1.75rem] border-y border-l border-muted hover:underline focus:underline"
            aria-expanded={open}
            aria-label={open ? `Collapse ${node.label}` : `Expand ${node.label}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-[0.75rem] w-[0.75rem] transition-transform duration-150 ${open ? "rotate-90" : ""} text-muted`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <div>
          <NodeList nodes={node.children} depth={depth + 1} />
        </div>
      )}
    </div>
  );
}

function LeafNode({
  node,
  depth,
  isLast,
}: {
  node: NavNode;
  depth: number;
  isLast: boolean;
}) {
  if (!node.href) return null;
  const isRoot = depth === 0;
  const paddingLeft = padLeft(depth);

  return (
    <div>
      <div className="relative">
        <ConnectorLines depth={depth} isLast={isLast} />
        <a
          href={node.href}
          className={isRoot
            ? "block py-[calc(var(--spacing-vsp-xs)+0.15rem)] text-small font-semibold text-fg hover:text-accent hover:underline focus:underline"
            : `block py-vsp-2xs ${isLast ? "pb-vsp-xs" : ""} text-small text-muted hover:text-accent hover:underline focus:underline`
          }
          style={{ paddingLeft }}
        >
          {node.label}
        </a>
      </div>
    </div>
  );
}
