export interface FindResult {
  matches: number;
  activeMatchOrdinal: number; // 1-based
}

export interface FindInPage {
  find(container: HTMLElement, query: string): FindResult;
  next(): FindResult;
  prev(): FindResult;
  stop(): void;
}

const MATCH_CLASS = "find-match";
const ACTIVE_CLASS = "find-match-active";
const MATCH_ATTR = "data-find-match";
const ACTIVE_ATTR = "data-find-active";

const EMPTY_RESULT: FindResult = Object.freeze({ matches: 0, activeMatchOrdinal: 0 });

/**
 * Create a DOM-based find-in-page utility.
 *
 * Limitation: only matches within single text nodes. Cross-element matching
 * (e.g. "Hello world" spanning `<strong>Hello</strong> world`) is not supported.
 */
export function createFindInPage(): FindInPage {
  let matchElements: HTMLElement[] = [];
  let activeIndex = -1;

  function clearMarks(): void {
    const parentsToNormalize = new Set<Node>();

    for (let i = matchElements.length - 1; i >= 0; i--) {
      const mark = matchElements[i];
      const parent = mark.parentNode;
      if (parent) {
        const textNode = document.createTextNode(mark.textContent || "");
        parent.replaceChild(textNode, mark);
        parentsToNormalize.add(parent);
      }
    }
    for (const parent of parentsToNormalize) {
      (parent as Element).normalize();
    }
    matchElements = [];
    activeIndex = -1;
  }

  function setActive(index: number): void {
    if (activeIndex >= 0 && activeIndex < matchElements.length) {
      const prev = matchElements[activeIndex];
      prev.classList.remove(ACTIVE_CLASS);
      prev.removeAttribute(ACTIVE_ATTR);
    }
    activeIndex = index;
    if (activeIndex >= 0 && activeIndex < matchElements.length) {
      const current = matchElements[activeIndex];
      current.classList.add(ACTIVE_CLASS);
      current.setAttribute(ACTIVE_ATTR, "true");
      current.scrollIntoView?.({ block: "center" });
    }
  }

  function currentResult(): FindResult {
    if (matchElements.length === 0) {
      return EMPTY_RESULT;
    }
    return {
      matches: matchElements.length,
      activeMatchOrdinal: activeIndex + 1,
    };
  }

  function find(container: HTMLElement, query: string): FindResult {
    clearMarks();

    if (!query) {
      return EMPTY_RESULT;
    }

    const lowerQuery = query.toLowerCase();

    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null,
    );

    const textNodes: Text[] = [];
    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      textNodes.push(node);
    }

    for (const textNode of textNodes) {
      const text = textNode.textContent || "";
      const lowerText = text.toLowerCase();

      const positions: number[] = [];
      let searchFrom = 0;
      while (searchFrom < lowerText.length) {
        const idx = lowerText.indexOf(lowerQuery, searchFrom);
        if (idx === -1) break;
        positions.push(idx);
        searchFrom = idx + lowerQuery.length;
      }

      if (positions.length === 0) continue;

      const parent = textNode.parentNode;
      if (!parent) continue;

      let remainingNode: Text = textNode;
      const nodeMarks: HTMLElement[] = [];

      for (let i = positions.length - 1; i >= 0; i--) {
        const pos = positions[i];
        const matchLen = query.length;

        if (pos + matchLen < remainingNode.length) {
          remainingNode.splitText(pos + matchLen);
        }

        let matchNode: Text;
        if (pos > 0) {
          matchNode = remainingNode.splitText(pos);
        } else {
          matchNode = remainingNode;
        }

        const mark = document.createElement("mark");
        mark.className = MATCH_CLASS;
        mark.setAttribute(MATCH_ATTR, "true");
        mark.textContent = matchNode.textContent;

        parent.replaceChild(mark, matchNode);
        nodeMarks.unshift(mark);
      }

      matchElements.push(...nodeMarks);
    }

    if (matchElements.length === 0) {
      return EMPTY_RESULT;
    }

    setActive(0);
    return currentResult();
  }

  function next(): FindResult {
    if (matchElements.length === 0) {
      return EMPTY_RESULT;
    }
    const newIndex = (activeIndex + 1) % matchElements.length;
    setActive(newIndex);
    return currentResult();
  }

  function prev(): FindResult {
    if (matchElements.length === 0) {
      return EMPTY_RESULT;
    }
    const newIndex =
      (activeIndex - 1 + matchElements.length) % matchElements.length;
    setActive(newIndex);
    return currentResult();
  }

  function stop(): void {
    clearMarks();
  }

  return { find, next, prev, stop };
}
