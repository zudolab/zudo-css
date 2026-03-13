import { useState } from "react";
import type { NavNode } from "@/utils/docs";

// Indentation — matching sidebar-tree fluid clamp values
const INDENT = "clamp(0.8rem, 1.2vw, 1.625rem)";
const CONNECTOR_OFFSET = "clamp(0.2rem, 0.3vw, 0.5rem)";
const CONNECTOR_WIDTH = "clamp(0.4rem, 0.6vw, 1rem)";

function padLeft(depth: number): string {
  if (depth === 0) return "clamp(0.4rem, 0.8vw, 1.3rem)";
  return `calc(${depth} * ${INDENT} + 1.25rem + 5px)`;
}

function connectorLeft(depth: number): string {
  return `calc(${depth} * ${INDENT} + ${CONNECTOR_OFFSET})`;
}

interface SiteTreeNavProps {
  tree: NavNode[];
  ariaLabel?: string;
  expandLabel?: string;
  collapseLabel?: string;
}

export default function SiteTreeNav({
  tree,
  ariaLabel = "Site index",
  expandLabel = "Expand",
  collapseLabel = "Collapse",
}: SiteTreeNavProps) {
  return (
    <nav aria-label={ariaLabel} className="grid grid-cols-1 gap-y-vsp-md">
      {tree.map((node) => (
        <SectionCard
          key={node.slug}
          node={node}
          expandLabel={expandLabel}
          collapseLabel={collapseLabel}
        />
      ))}
    </nav>
  );
}

function SectionCard({
  node,
  expandLabel,
  collapseLabel,
}: {
  node: NavNode;
  expandLabel: string;
  collapseLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const hasChildren = node.children.length > 0;

  const toggle = () => setOpen((prev) => !prev);

  return (
    <div className="border border-muted overflow-hidden">
      {/* Header */}
      <div className="flex items-center bg-surface">
        <div className="flex-1 min-w-0 px-hsp-lg py-vsp-md">
          {node.href ? (
            <a
              href={node.href}
              className="font-medium text-accent hover:underline"
            >
              {node.label}
            </a>
          ) : (
            <button
              type="button"
              onClick={toggle}
              aria-expanded={hasChildren ? open : undefined}
              className="font-medium text-accent hover:underline text-left"
            >
              {node.label}
            </button>
          )}
          {node.description && (
            <span className="block text-small text-muted mt-vsp-2xs">
              {node.description}
            </span>
          )}
        </div>
        {hasChildren && (
          <button
            type="button"
            onClick={toggle}
            className="px-hsp-lg py-vsp-md text-muted hover:text-fg shrink-0"
            aria-expanded={open}
            aria-label={`${open ? collapseLabel : expandLabel} ${node.label}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-[1rem] w-[1rem] transition-transform duration-150 ${open ? "rotate-90" : ""}`}
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
        )}
      </div>

      {/* Children — sidebar-style dashed tree */}
      {open && hasChildren && (
        <div className="border-t border-muted">
          <NodeList nodes={node.children} depth={0} />
        </div>
      )}
    </div>
  );
}

function ConnectorLines({ depth, isLast }: { depth: number; isLast: boolean }) {
  if (depth === 0) return null;
  const left = connectorLeft(depth);
  return (
    <>
      <div
        className="absolute border-l border-dashed border-muted"
        style={{
          left,
          top: 0,
          bottom: isLast ? "50%" : 0,
        }}
      />
      <div
        className="absolute border-t border-dashed border-muted"
        style={{
          left,
          width: CONNECTOR_WIDTH,
          top: "50%",
        }}
      />
    </>
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
  const [open, setOpen] = useState(false);
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
