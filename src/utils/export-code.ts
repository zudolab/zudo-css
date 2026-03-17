export interface ExportColorState {
  background: number;
  foreground: number;
  cursor: number;
  selectionBg: number;
  selectionFg: number;
  palette: string[];
  semanticMappings: Record<string, number | "bg" | "fg">;
  shikiTheme: string;
}

export function generateCode(colorState: ExportColorState): string {
  const { palette, semanticMappings } = colorState;

  const paletteLines = palette
    .map((c, i) => {
      const isRowEnd = i % 4 === 3;
      const isLast = i === palette.length - 1;
      if (isRowEnd && !isLast) return `"${c}",\n    `;
      if (isRowEnd) return `"${c}",`;
      return `"${c}", `;
    })
    .join("");

  const semanticEntries = Object.entries(semanticMappings);
  const semanticLines = semanticEntries
    .map(([key, value]) => {
      if (typeof value === "string") return `    ${key}: "${value}",`;
      return `    ${key}: ${value},`;
    })
    .join("\n");

  return `{
  background: ${colorState.background},
  foreground: ${colorState.foreground},
  cursor: ${colorState.cursor},
  selectionBg: ${colorState.selectionBg},
  selectionFg: ${colorState.selectionFg},
  palette: [
    ${paletteLines}
  ],
  shikiTheme: "${colorState.shikiTheme}",${
    semanticEntries.length > 0
      ? `\n  semantic: {\n${semanticLines}\n  },`
      : ""
  }
}`;
}
