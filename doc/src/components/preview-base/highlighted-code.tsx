import { useEffect, useState } from 'react';
import type { HighlighterCore } from 'shiki';
import styles from './preview-base.module.css';

let highlighterPromise: Promise<HighlighterCore> | null = null;

function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = import('shiki').then(({ createHighlighter }) =>
      createHighlighter({
        themes: ['dracula', 'github-light'],
        langs: ['html', 'css'],
      }),
    );
  }
  return highlighterPromise;
}

interface HighlightedCodeProps {
  code: string;
  language: string;
}

export default function HighlightedCode({
  code,
  language,
}: HighlightedCodeProps) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getHighlighter().then((highlighter) => {
      if (cancelled) return;
      const lang = highlighter.getLoadedLanguages().includes(language)
        ? language
        : 'text';
      const result = highlighter.codeToHtml(code, {
        lang,
        themes: { light: 'github-light', dark: 'dracula' },
        defaultColor: false,
      });
      setHtml(result);
    });
    return () => {
      cancelled = true;
    };
  }, [code, language]);

  if (!html) {
    return (
      <pre className={styles.codeBlockPre}>
        <code className={`${styles.codeBlockCode} language-${language}`}>
          {code}
        </code>
      </pre>
    );
  }

  return (
    <div
      className={styles.codeBlockHighlighted}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
