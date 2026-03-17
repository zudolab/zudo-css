import { type ReactNode, useMemo } from "react";
import PreviewBase from "../html-preview/preview-base";
import { dedent } from "@/utils/dedent";

interface TailwindPreviewProps {
  html: string;
  css?: string;
  title?: string;
  height?: number;
  defaultOpen?: boolean;
}

function buildSrcdoc(html: string, css?: string): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<script src="https://cdn.tailwindcss.com"></script>
${css ? `<style>${css}</style>` : ""}
</head>
<body>${html}</body>
</html>`;
}

export default function TailwindPreview({
  html,
  css,
  title,
  height,
  defaultOpen,
}: TailwindPreviewProps): ReactNode {
  const srcdoc = useMemo(() => buildSrcdoc(html, css), [html, css]);

  return (
    <PreviewBase
      title={title}
      height={height}
      srcdoc={srcdoc}
      defaultOpen={defaultOpen}
      sandbox="allow-scripts allow-same-origin"
      syncDelay={300}
      codeBlocks={[
        { language: "html", title: "HTML", code: dedent(html) },
        ...(css ? [{ language: "css", title: "CSS", code: dedent(css) }] : []),
      ]}
    />
  );
}
