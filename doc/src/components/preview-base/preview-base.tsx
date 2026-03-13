import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import styles from './preview-base.module.css';

export interface CodeBlockData {
  language: string;
  title: string;
  code: string;
}

export interface PreviewBaseProps {
  title?: string;
  height?: number;
  srcdoc: string;
  sandbox: string;
  syncDelay: number;
  codeBlocks: CodeBlockData[];
  defaultOpen?: boolean;
}

type Viewport = { label: string; width: string };

const VIEWPORTS: Viewport[] = [
  { label: 'Mobile', width: '320px' },
  { label: 'Tablet', width: '768px' },
  { label: 'Full', width: '100%' },
];

export default function PreviewBase({
  title,
  height,
  srcdoc,
  sandbox,
  syncDelay,
  codeBlocks,
  defaultOpen,
}: PreviewBaseProps): ReactNode {
  const [activeViewport, setActiveViewport] = useState(2); // default: Full
  const [codeOpen, setCodeOpen] = useState(defaultOpen ?? false);
  const [iframeHeight, setIframeHeight] = useState(height ?? 200);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const syncHeight = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe || height) return; // skip if explicit height given
    try {
      const doc = iframe.contentDocument;
      if (doc?.body) {
        const h = doc.body.scrollHeight;
        if (h > 0) setIframeHeight(Math.max(h + 16, 200));
      }
    } catch {
      // cross-origin or not yet loaded — ignore
    }
  }, [height]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    let timeoutId: ReturnType<typeof setTimeout>;
    const onLoad = () => {
      if (syncDelay > 0) {
        timeoutId = setTimeout(syncHeight, syncDelay);
      } else {
        syncHeight();
      }
    };
    iframe.addEventListener('load', onLoad);
    return () => {
      iframe.removeEventListener('load', onLoad);
      clearTimeout(timeoutId);
    };
  }, [syncHeight, srcdoc, syncDelay]);

  // Re-measure height when viewport changes (content reflows)
  useEffect(() => {
    if (height) return; // skip if explicit height given
    const id = setTimeout(syncHeight, 150);
    return () => clearTimeout(id);
  }, [activeViewport, syncHeight, height]);

  const containerWidth = VIEWPORTS[activeViewport].width;

  return (
    <div className={styles.wrapper}>
      {/* Title bar with viewport buttons */}
      <div className={styles.titleBar}>
        {title && <span className={styles.title}>{title}</span>}
        <div className={styles.viewportButtons}>
          {VIEWPORTS.map((vp, i) => (
            <button
              key={vp.label}
              type="button"
              className={
                i === activeViewport
                  ? styles.viewportBtnActive
                  : styles.viewportBtn
              }
              aria-pressed={i === activeViewport}
              onClick={() => setActiveViewport(i)}
            >
              {vp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preview area */}
      <div className={styles.previewArea}>
        <div
          className={styles.previewContainer}
          style={{ width: containerWidth }}
        >
          <iframe
            ref={iframeRef}
            className={styles.iframe}
            srcDoc={srcdoc}
            sandbox={sandbox}
            style={{ height: iframeHeight }}
            title={title ?? 'Preview'}
          />
        </div>
      </div>

      {/* Code section */}
      <div className={styles.codeSection}>
        <button
          type="button"
          className={styles.codeToggle}
          onClick={() => setCodeOpen((v) => !v)}
          aria-expanded={codeOpen}
        >
          <span
            className={
              codeOpen ? styles.codeToggleIconOpen : styles.codeToggleIcon
            }
          >
            &#9654;
          </span>
          {codeOpen ? 'Hide code' : 'Show code'}
        </button>
        {codeOpen && (
          <div className={styles.codeContent}>
            {codeBlocks.map((block) => (
              <div key={block.title} className={styles.codeBlock}>
                <span className={styles.codeBlockTitle}>{block.title}</span>
                <pre className={styles.codeBlockPre}>
                  <code
                    className={`${styles.codeBlockCode} language-${block.language}`}
                  >
                    {block.code}
                  </code>
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
