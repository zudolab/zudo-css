import { useState, useEffect, useRef, useCallback } from "react";

interface NavItem {
  label: string;
  href: string;
  isActive: boolean;
}

interface HeaderNavProps {
  items: NavItem[];
}

const GAP_REM = 0.125; // gap-x-hsp-2xs

function getGapPx() {
  return (
    GAP_REM * parseFloat(getComputedStyle(document.documentElement).fontSize)
  );
}

export default function HeaderNav({ items }: HeaderNavProps) {
  const navRef = useRef<HTMLElement>(null);
  const measureRowRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(items.length);
  const [menuOpen, setMenuOpen] = useState(false);

  // Stable key for item content (labels affect measured widths)
  const itemsKey = items.map((i) => i.label).join("\t");

  const recalculate = useCallback(() => {
    const nav = navRef.current;
    const measureRow = measureRowRef.current;
    if (!nav || !measureRow) return;

    const containerWidth = nav.clientWidth;
    const measureItems =
      measureRow.querySelectorAll<HTMLElement>("[data-measure]");
    const moreMeasure = measureRow.querySelector<HTMLElement>(
      "[data-measure-more]",
    );

    const widths = Array.from(measureItems).map((el) => el.offsetWidth);
    const moreWidth = moreMeasure?.offsetWidth ?? 44;
    const gap = getGapPx();

    // Check if all items fit without the "..." button
    let total = 0;
    for (let i = 0; i < widths.length; i++) {
      if (i > 0) total += gap;
      total += widths[i];
    }

    if (total <= containerWidth) {
      setVisibleCount(widths.length);
      return;
    }

    // Not all fit — find how many fit alongside the "..." button
    const available = containerWidth - moreWidth - gap;
    let used = 0;
    let count = 0;
    for (let i = 0; i < widths.length; i++) {
      const needed = (i > 0 ? gap : 0) + widths[i];
      if (used + needed > available) break;
      used += needed;
      count++;
    }

    setVisibleCount(Math.max(1, count));
  }, [itemsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial calculation + resize observer
  useEffect(() => {
    recalculate();

    const nav = navRef.current;
    if (!nav) return;
    const observer = new ResizeObserver(recalculate);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [recalculate]);

  // Recalculate after fonts load (widths may change)
  useEffect(() => {
    document.fonts.ready.then(recalculate);
  }, [recalculate]);

  // Close menu on click outside or Escape
  useEffect(() => {
    if (!menuOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        moreButtonRef.current &&
        !moreButtonRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        moreButtonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  // Focus first dropdown item when menu opens
  useEffect(() => {
    if (menuOpen && menuRef.current) {
      const firstLink = menuRef.current.querySelector<HTMLAnchorElement>("a");
      firstLink?.focus();
    }
  }, [menuOpen]);

  // Close on Astro View Transition navigation
  useEffect(() => {
    const handleSwap = () => setMenuOpen(false);
    document.addEventListener("astro:after-swap", handleSwap);
    return () => document.removeEventListener("astro:after-swap", handleSwap);
  }, []);

  if (items.length === 0) return null;

  const visibleItems = items.slice(0, visibleCount);
  const overflowItems = items.slice(visibleCount);
  const hasOverflow = overflowItems.length > 0;

  return (
    <nav
      ref={navRef}
      aria-label="Main"
      className="relative ml-hsp-xl hidden min-w-0 flex-1 items-center gap-x-hsp-2xs whitespace-nowrap lg:flex"
    >
      {/* Hidden measurement row — mirrors item styles for accurate width calculation */}
      <div
        ref={measureRowRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          visibility: "hidden",
          pointerEvents: "none",
          whiteSpace: "nowrap",
          display: "flex",
          gap: `${GAP_REM}rem`,
        }}
      >
        {items.map((item) => (
          <span
            key={item.href}
            data-measure
            className="px-hsp-md py-vsp-2xs text-small font-medium"
          >
            {item.label}
          </span>
        ))}
        <span
          data-measure-more
          className="px-hsp-md py-vsp-2xs text-small font-medium"
        >
          &middot;&middot;&middot;
        </span>
      </div>

      {/* Visible nav items */}
      {visibleItems.map((item) => (
        <a
          key={item.href}
          href={item.href}
          aria-current={item.isActive ? "page" : undefined}
          className={`shrink-0 px-hsp-md py-vsp-2xs text-small font-medium transition-colors ${
            item.isActive
              ? "bg-fg text-bg"
              : "text-muted hover:underline focus:underline"
          }`}
        >
          {item.label}
        </a>
      ))}

      {/* "..." overflow trigger */}
      {hasOverflow && (
        <button
          ref={moreButtonRef}
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-haspopup="true"
          aria-label="More navigation items"
          className="shrink-0 px-hsp-md py-vsp-2xs text-small font-medium text-muted transition-colors hover:underline focus:underline"
        >
          <span aria-hidden="true">&middot;&middot;&middot;</span>
        </button>
      )}

      {/* Dropdown for overflowed items */}
      {menuOpen && hasOverflow && (
        <div
          ref={menuRef}
          role="menu"
          className="absolute right-0 top-full z-50 mt-px min-w-[10rem] border border-muted bg-surface py-vsp-2xs"
          style={{ boxShadow: "0 4px 12px color-mix(in srgb, var(--zd-bg) 50%, transparent)" }}
        >
          {overflowItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              role="menuitem"
              aria-current={item.isActive ? "page" : undefined}
              className={`block px-hsp-lg py-vsp-2xs text-small font-medium whitespace-nowrap transition-colors ${
                item.isActive
                  ? "bg-fg text-bg"
                  : "text-muted hover:underline focus:underline"
              }`}
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
