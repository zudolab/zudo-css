import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import type { NavNode } from "@/utils/docs";
import { INDENT, BASE_PAD, connectorLeft, ConnectorLines } from "./tree-nav-shared";

function CategoryLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 103.395 107.049"
      aria-hidden="true"
      className={`w-[14px] shrink-0 ${className ?? ""}`}
    >
      <path d="M5.746 5.74 0 11.49l20.987 20.96C34.126 45.572 41.963 53.45 41.948 53.523c-.012.062-9.456 9.544-20.986 21.07L0 95.55l5.714 5.715c3.142 3.143 5.748 5.715 5.79 5.715s2.63-2.563 5.75-5.696l17.939-18.001c21.867-21.94 29.443-29.599 29.443-29.768 0-.114-.665-.804-5.084-5.275C51.872 40.47 11.71.125 11.565.036 11.525.01 8.906 2.578 5.746 5.74m38.345-.066c-3.132 3.13-5.696 5.71-5.696 5.732-.001.022 2.16 2.185 4.8 4.807 2.641 2.623 8.382 8.338 12.758 12.702 15.38 15.337 23.763 23.641 24.314 24.086.19.153.346.336.346.405 0 .07-1.738 1.847-3.887 3.976a17515 17515 0 0 0-20.35 20.264 19555 19555 0 0 1-17.223 17.158c-.416.409-.757.77-.757.8 0 .083 11.415 11.485 11.457 11.445.235-.22 53.542-53.528 53.542-53.543C103.395 53.472 49.891.02 49.837 0c-.028-.01-2.613 2.543-5.746 5.674" />
    </svg>
  );
}

const STORAGE_KEY = "zd-sidebar-open";

function padLeft(depth: number, forCategory: boolean): string {
  if (depth === 0) return `calc(${BASE_PAD} + ${forCategory ? "0.15rem" : "0rem"})`;
  return `calc(${depth} * ${INDENT} + 1.25rem + 5px)`;
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
            aria-label="Filter sidebar"
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
              aria-current={isActive ? "page" : undefined}
              className={`flex-1 flex items-center gap-hsp-xs py-vsp-xs hover:underline focus:underline ${isActive ? "text-bg" : "text-fg"}`}
            >
              {depth === 0 && <CategoryLinkIcon className={isActive ? "text-bg" : ""} />}
              {node.label}
            </a>
          ) : (
            <button
              type="button"
              onClick={toggle}
              aria-expanded={isExpanded}
              className="flex-1 py-vsp-xs text-left hover:underline focus:underline"
            >
              {node.label}
            </button>
          )}
          <button
            type="button"
            onClick={toggle}
            className={`aspect-square flex items-center justify-center w-[1.5rem] border-y border-l hover:underline focus:underline ${isActive ? "border-bg/30" : "border-muted"}`}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? `Collapse ${node.label}` : `Expand ${node.label}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-[0.625rem] w-[0.625rem] transition-transform duration-150 ${isExpanded ? "rotate-90" : ""} ${isActive ? "text-bg" : "text-muted"}`}
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
          aria-current={isActive ? "page" : undefined}
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
