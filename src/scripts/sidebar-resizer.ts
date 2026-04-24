export function initSidebarResizer() {
  const sidebar = document.getElementById("desktop-sidebar");
  if (!sidebar || sidebar.querySelector("[data-sidebar-resizer]")) return;

  // Resizer allows a wider range (192–448px) than the CSS default
  // (clamp(14rem, 20vw, 22rem) = 224–352px at 16px base).
  // CSS provides the responsive initial width; the resizer lets users
  // go beyond that range when explicitly dragging or using keyboard arrows.
  const MIN_W = 192;
  const MAX_W = 448;
  const STEP = 10;
  const LS_KEY = "zudo-doc-sidebar-width";
  const CSS_PROP = "--zd-sidebar-w";
  const ACCENT_BG = "var(--zd-accent, rgba(128,128,128,0.3))";
  const ACCENT_OUTLINE = "2px solid var(--zd-accent, rgba(128,128,128,0.5))";
  const ACCENT_GHOST = "var(--zd-accent, rgba(128,128,128,0.5))";

  function readCurrentWidth(): number {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(CSS_PROP);
    return raw ? parseFloat(raw) || MIN_W : MIN_W;
  }

  let cachedWidth = readCurrentWidth();

  const handle = document.createElement("div");
  handle.setAttribute("data-sidebar-resizer", "");
  handle.setAttribute("tabindex", "0");
  handle.setAttribute("role", "separator");
  handle.setAttribute("aria-orientation", "vertical");
  handle.setAttribute("aria-label", "Resize sidebar");
  handle.setAttribute("aria-valuemin", String(MIN_W));
  handle.setAttribute("aria-valuemax", String(MAX_W));
  handle.setAttribute("aria-valuenow", String(Math.round(cachedWidth)));
  Object.assign(handle.style, {
    position: "absolute",
    top: "0",
    right: "0",
    width: "6px",
    height: "100%",
    cursor: "col-resize",
    zIndex: "10",
    transition: "background 0.15s",
  });

  let dragging = false;

  function applyWidth(w: number) {
    cachedWidth = Math.max(MIN_W, Math.min(MAX_W, w));
    document.documentElement.style.setProperty(CSS_PROP, cachedWidth + "px");
    try { localStorage.setItem(LS_KEY, String(Math.round(cachedWidth))); } catch {}
    handle.setAttribute("aria-valuenow", String(Math.round(cachedWidth)));
  }

  let focused = false;

  function updateHandleVisual() {
    if (dragging || focused) {
      handle.style.background = ACCENT_BG;
    } else {
      handle.style.background = "";
    }
    handle.style.outline = focused && !dragging ? ACCENT_OUTLINE : "";
    handle.style.outlineOffset = focused && !dragging ? "1px" : "";
  }

  handle.addEventListener("focus", () => {
    focused = true;
    updateHandleVisual();
  });
  handle.addEventListener("blur", () => {
    focused = false;
    updateHandleVisual();
  });

  handle.addEventListener("keydown", (e: KeyboardEvent) => {
    let w = cachedWidth;
    switch (e.key) {
      case "ArrowLeft":
        w = Math.max(MIN_W, w - STEP);
        break;
      case "ArrowRight":
        w = Math.min(MAX_W, w + STEP);
        break;
      case "Home":
        w = MIN_W;
        break;
      case "End":
        w = MAX_W;
        break;
      default:
        return;
    }
    e.preventDefault();
    applyWidth(w);
  });

  handle.addEventListener("mouseenter", () => {
    if (!dragging && !focused) handle.style.background = ACCENT_BG;
  });
  handle.addEventListener("mouseleave", () => {
    if (!dragging && !focused) handle.style.background = "";
  });

  handle.addEventListener("pointerdown", (e: PointerEvent) => {
    e.preventDefault();
    handle.setPointerCapture(e.pointerId);
    dragging = true;
    updateHandleVisual();
    document.documentElement.style.cursor = "col-resize";
    document.documentElement.style.userSelect = "none";

    // Ghost line — cheap to move (no reflow), shows target position
    const ghost = document.createElement("div");
    Object.assign(ghost.style, {
      position: "fixed",
      top: "0",
      width: "2px",
      height: "100vh",
      background: ACCENT_GHOST,
      pointerEvents: "none",
      zIndex: "9999",
    });
    const sidebarRect = sidebar.getBoundingClientRect();
    const sidebarLeft = sidebarRect.left;
    ghost.style.left = (sidebarLeft + sidebarRect.width) + "px";
    document.body.appendChild(ghost);
    let targetWidth = 0;

    const onMove = (ev: PointerEvent) => {
      targetWidth = Math.max(MIN_W, Math.min(MAX_W, ev.clientX - sidebarLeft));
      ghost.style.left = (sidebarLeft + targetWidth) + "px";
    };

    const cleanup = () => {
      dragging = false;
      updateHandleVisual();
      document.documentElement.style.cursor = "";
      document.documentElement.style.userSelect = "";
      ghost.remove();
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
      handle.removeEventListener("pointercancel", onCancel);
      handle.removeEventListener("lostpointercapture", onCancel);
    };

    const onUp = (ev: PointerEvent) => {
      handle.releasePointerCapture(ev.pointerId);
      cleanup();
      if (targetWidth > 0) {
        applyWidth(targetWidth);
      }
    };

    const onCancel = () => {
      cleanup();
    };

    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
    handle.addEventListener("pointercancel", onCancel);
    handle.addEventListener("lostpointercapture", onCancel);
  });

  sidebar.appendChild(handle);
}
