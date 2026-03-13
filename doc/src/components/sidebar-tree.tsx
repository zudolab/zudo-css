import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import type { NavNode } from "@/utils/docs";

const STORAGE_KEY = "zd-sidebar-open";

// Sidebar indentation — fluid with clamp()
// Base padding scales: 0.5rem → 2vw → 1rem
// Indent per depth: 1rem → 2vw → 1.25rem
const BASE_PAD = "clamp(0.4rem, 0.8vw, 1.3rem)";
const INDENT = "clamp(0.8rem, 1.2vw, 1.625rem)";
const CONNECTOR_OFFSET = "clamp(0.2rem, 0.3vw, 0.5rem)";
const CONNECTOR_WIDTH = "clamp(0.4rem, 0.6vw, 1rem)";

function padLeft(depth: number, forCategory: boolean): string {
  if (depth === 0) return `calc(${BASE_PAD} + ${forCategory ? "0.15rem" : "0rem"})`;
  return `calc(${depth} * ${INDENT} + 1.25rem + 5px)`;
}

function connectorLeft(depth: number): string {
  return `calc(${depth} * ${INDENT} + ${CONNECTOR_OFFSET})`;
}

function getOpenSet(): Set<string> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.filter((v): v is string => typeof v === "string")) : new Set();
  } catch {
    return new Set();
  }
}

function saveOpenSet(set: Set<string>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    // ignore
  }
}

function normalizePath(p: string): string {
  return p.replace(/\/$/, "") || "/";
}

/** Find the slug of the node whose href matches the given pathname */
function findActiveSlug(nodes: NavNode[], pathname: string): string | undefined {
  for (const node of nodes) {
    if (node.href && normalizePath(node.href) === pathname) return node.slug;
    const found = findActiveSlug(node.children, pathname);
    if (found) return found;
  }
  return undefined;
}

/** Track current active slug, updating on View Transition navigations */
function useActiveSlug(nodes: NavNode[], initial?: string): string | undefined {
  const [slug, setSlug] = useState(initial);

  useEffect(() => {
    const update = () => {
      const pathname = normalizePath(window.location.pathname);
      const found = findActiveSlug(nodes, pathname);
      if (found !== undefined) setSlug(found);
    };
    update();
    document.addEventListener("astro:after-swap", update);
    return () => document.removeEventListener("astro:after-swap", update);
  }, [nodes]);

  return slug;
}

function filterTree(nodes: NavNode[], query: string): NavNode[] {
  return nodes.reduce<NavNode[]>((acc, node) => {
    const matchesLabel = node.label.toLowerCase().includes(query.toLowerCase());
    const filteredChildren = node.children.length > 0
      ? filterTree(node.children, query)
      : [];

    if (matchesLabel || filteredChildren.length > 0) {
      acc.push({
        ...node,
        children: matchesLabel ? node.children : filteredChildren,
      });
    }
    return acc;
  }, []);
}

interface SidebarTreeProps {
  nodes: NavNode[];
  currentSlug?: string;
  backToMenuHref?: string;
  backToMenuLabel?: string;
}

export default function SidebarTree({ nodes, currentSlug, backToMenuHref, backToMenuLabel }: SidebarTreeProps) {
  const activeSlug = useActiveSlug(nodes, currentSlug);
  const [query, setQuery] = useState("");
  const filterRef = useRef<HTMLInputElement>(null);

  // Global shortcut: Cmd+/ (Mac) or Ctrl+/ to focus the filter input
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && (e.metaKey || e.ctrlKey)) {
        const el = filterRef.current;
        if (!el || el.offsetParent === null) return; // skip if hidden
        e.preventDefault();
        el.focus();
        el.select();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredNodes = useMemo(
    () => (query ? filterTree(nodes, query) : nodes),
    [nodes, query],
  );

  return (
    <nav>
      {backToMenuHref && (
        <a
          href={backToMenuHref}
          className="flex items-center gap-hsp-xs px-hsp-sm py-vsp-xs text-small text-muted hover:text-fg border-b border-muted"
        >
          <svg className="h-[1rem] w-[1rem] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {backToMenuLabel ?? "Back to main menu"}
        </a>
      )}
      <div className="px-hsp-sm py-vsp-xs border-b border-muted">
        <div className="flex items-center gap-hsp-xs bg-surface rounded px-hsp-sm py-vsp-2xs">
          <svg className="h-[14px] w-[14px] text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={filterRef}
            type="text"
            placeholder="Filter..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent text-small outline-none w-full text-fg placeholder:text-muted"
          />
        </div>
      </div>
      <NodeList
        nodes={filteredNodes}
        currentSlug={activeSlug}
        depth={0}
        forceOpen={!!query}
      />
    </nav>
  );
}

function NodeList({
  nodes,
  currentSlug,
  depth,
  forceOpen,
}: {
  nodes: NavNode[];
  currentSlug?: string;
  depth: number;
  forceOpen: boolean;
}) {
  return (
    <>
      {nodes.map((node, index) => {
        const isLast = index === nodes.length - 1;
        return node.children.length > 0 ? (
          <CategoryNode
            key={node.slug}
            node={node}
            currentSlug={currentSlug}
            depth={depth}
            isLast={isLast}
            forceOpen={forceOpen}
          />
        ) : (
          <LeafNode
            key={node.slug}
            node={node}
            currentSlug={currentSlug}
            depth={depth}
            isLast={isLast}
          />
        );
      })}
    </>
  );
}

/** Check if currentSlug is anywhere in this node's subtree */
function subtreeContainsSlug(node: NavNode, slug?: string): boolean {
  if (!slug) return false;
  if (node.slug === slug) return true;
  return node.children.some((child) => subtreeContainsSlug(child, slug));
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

function CategoryNode({
  node,
  currentSlug,
  depth,
  isLast,
  forceOpen,
}: {
  node: NavNode;
  currentSlug?: string;
  depth: number;
  isLast: boolean;
  forceOpen: boolean;
}) {
  const containsCurrent = subtreeContainsSlug(node, currentSlug);
  const isActive = node.slug === currentSlug;

  // Initial state must match server render (no sessionStorage access)
  // to avoid hydration mismatch. Stored state is restored in useEffect below.
  const [open, setOpen] = useState(containsCurrent);

  // Restore open state from sessionStorage after hydration
  useEffect(() => {
    const stored = getOpenSet();
    if (stored.has(node.slug) && !open) {
      setOpen(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-open category when navigation lands on a descendant
  useEffect(() => {
    if (subtreeContainsSlug(node, currentSlug) && !open) {
      setOpen(true);
      const stored = getOpenSet();
      stored.add(node.slug);
      saveOpenSet(stored);
    }
  }, [currentSlug]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync auto-opened state to sessionStorage so it persists across View Transitions
  useEffect(() => {
    if (open) {
      const stored = getOpenSet();
      if (!stored.has(node.slug)) {
        stored.add(node.slug);
        saveOpenSet(stored);
      }
    }
  }, [open, node.slug]);

  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      const stored = getOpenSet();
      if (next) {
        stored.add(node.slug);
      } else {
        stored.delete(node.slug);
      }
      saveOpenSet(stored);
      return next;
    });
  }, [node.slug]);

  const isExpanded = forceOpen || open;
  const paddingLeft = padLeft(depth, true);

  return (
    <div className={`${depth === 0 ? "border-t border-muted" : ""} ${depth >= 1 && !isLast ? "relative" : ""}`}>
      {depth >= 1 && !isLast && isExpanded && (
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
          className={`flex w-full items-center justify-between text-small font-semibold py-[0.15rem] ${isActive ? "bg-fg text-bg" : "text-fg"}`}
          style={{ paddingLeft }}
        >
          {node.href ? (
            <a
              href={node.href}
              className={`flex-1 py-vsp-xs hover:underline focus:underline ${isActive ? "text-bg" : "text-fg"}`}
            >
              {node.label}
            </a>
          ) : (
            <button
              type="button"
              onClick={toggle}
              className="flex-1 py-vsp-xs text-left hover:underline focus:underline"
            >
              {node.label}
            </button>
          )}
          <button
            type="button"
            onClick={toggle}
            className="px-hsp-md py-vsp-xs hover:underline focus:underline"
            aria-label={isExpanded ? `Collapse ${node.label}` : `Expand ${node.label}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-[1rem] w-[1rem] transition-transform duration-150 ${isExpanded ? "rotate-90" : ""} ${isActive ? "text-bg" : "text-muted"}`}
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
      {isExpanded && (
        <div>
          <NodeList
            nodes={node.children}
            currentSlug={currentSlug}
            depth={depth + 1}
            forceOpen={forceOpen}
          />
        </div>
      )}
    </div>
  );
}

function LeafNode({
  node,
  currentSlug,
  depth,
  isLast,
}: {
  node: NavNode;
  currentSlug?: string;
  depth: number;
  isLast: boolean;
}) {
  if (!node.href) return null;
  const isActive = node.slug === currentSlug;
  const isRoot = depth === 0;
  const paddingLeft = padLeft(depth, isRoot);

  return (
    <div className={isRoot ? "border-t border-muted" : ""}>
      <div className="relative">
        <ConnectorLines depth={depth} isLast={isLast} />
        <a
          href={node.href}
          className={isRoot
            ? `block py-[calc(var(--spacing-vsp-xs)+0.15rem)] text-small font-semibold ${
                isActive ? "bg-fg text-bg" : "text-fg hover:underline focus:underline"
              }`
            : `block py-vsp-2xs ${isLast ? "pb-vsp-xs" : ""} text-small ${
                isActive
                  ? "bg-fg font-medium text-bg"
                  : "text-muted hover:underline focus:underline"
              }`
          }
          style={{ paddingLeft }}
        >
          {node.label}
        </a>
      </div>
    </div>
  );
}
