import { useState } from "react";
import type { NavNode } from "@/utils/docs";
import { INDENT, BASE_PAD, connectorLeft, ConnectorLines } from "./tree-nav-shared";

function padLeft(depth: number): string {
  if (depth === 0) return BASE_PAD;
  return `calc(${depth} * ${INDENT} + 1.25rem + 5px)`;
}

interface SiteTreeNavProps {
  tree: NavNode[];
  ariaLabel?: string;
}

export default function SiteTreeNav({
  tree,
  ariaLabel = "Site index",
}: SiteTreeNavProps) {
  return (
    <nav aria-label={ariaLabel}>
      <NodeList nodes={tree} depth={0} />
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
    <div className={`${depth === 0 ? "border-t border-muted first:border-t-0" : ""} ${depth >= 1 && !isLast ? "relative" : ""}`}>
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
              className="flex-1 py-vsp-xs text-fg hover:text-accent hover:underline focus:underline"
            >
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
            className="px-hsp-md py-vsp-xs hover:underline focus:underline"
            aria-expanded={open}
            aria-label={open ? `Collapse ${node.label}` : `Expand ${node.label}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-[1rem] w-[1rem] transition-transform duration-150 ${open ? "rotate-90" : ""} text-muted`}
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
    <div className={isRoot ? "border-t border-muted first:border-t-0" : ""}>
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
