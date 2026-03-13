// Shared constants and primitives for sidebar-tree and site-tree-nav

// Indentation — fluid clamp values
export const INDENT = "clamp(0.8rem, 1.2vw, 1.625rem)";
export const CONNECTOR_OFFSET = "clamp(0.2rem, 0.3vw, 0.5rem)";
export const CONNECTOR_WIDTH = "clamp(0.4rem, 0.6vw, 1rem)";
export const BASE_PAD = "clamp(0.4rem, 0.8vw, 1.3rem)";

export function connectorLeft(depth: number): string {
  return `calc(${depth} * ${INDENT} + ${CONNECTOR_OFFSET})`;
}

export function ConnectorLines({ depth, isLast }: { depth: number; isLast: boolean }) {
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
