import { useState, useEffect } from 'react';

export const SIDEBAR_STORAGE_KEY = 'zudo-doc-sidebar-visible';

function readState(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
}

function setDataAttribute(isVisible: boolean) {
  if (isVisible) {
    document.documentElement.removeAttribute('data-sidebar-hidden');
  } else {
    document.documentElement.setAttribute('data-sidebar-hidden', '');
  }
}

export default function DesktopSidebarToggle() {
  const [visible, setVisible] = useState(readState);

  // Sync attribute and localStorage when state changes
  useEffect(() => {
    setDataAttribute(visible);
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(visible));
    } catch {
      // ignore storage errors
    }
  }, [visible]);

  return (
    <button
      type="button"
      onClick={() => setVisible((v) => !v)}
      className="zd-desktop-sidebar-toggle hidden lg:flex fixed bottom-vsp-xl z-40 items-center justify-center w-[1.5rem] h-[3rem] bg-surface border border-muted border-l-0 rounded-r-DEFAULT text-muted cursor-pointer transition-[left,color] duration-200 ease-in-out hover:text-fg"
      aria-label={visible ? 'Hide sidebar' : 'Show sidebar'}
      aria-pressed={visible}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-icon-sm w-icon-sm"
        aria-hidden="true"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d={visible ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'}
        />
      </svg>
    </button>
  );
}
