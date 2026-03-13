export interface ColorScheme {
  background: string;
  foreground: string;
  cursor: string;
  selectionBg: string;
  selectionFg: string;
  palette: [
    string, string, string, string, string, string, string, string,
    string, string, string, string, string, string, string, string,
  ];
  shikiTheme: NonNullable<import("astro").ShikiConfig["theme"]>;
  /** Optional semantic overrides — when omitted, defaults are used:
   *  surface=palette[0], muted=palette[8], accent=palette[6], accentHover=palette[14]
   *  codeBg=foreground, codeFg=background, success=palette[2], danger=palette[1],
   *  warning=palette[3], info=palette[4] */
  semantic?: {
    surface?: string;
    muted?: string;
    accent?: string;
    accentHover?: string;
    codeBg?: string;
    codeFg?: string;
    success?: string;
    danger?: string;
    warning?: string;
    info?: string;
  };
}

export const colorSchemes: Record<string, ColorScheme> = {
  "ZCSS Dark": {
    background: "#181818",
    foreground: "#b8b8b8",
    cursor: "oklch(70.4% 0.04 256.788)",
    selectionBg: "#383838",
    selectionFg: "#e0e0e0",
    palette: [
      "#1c1c1c", "#da6871", "#93bb77", "#dfbb77",
      "#5caae9", "#c074d6", "oklch(70.4% 0.04 256.788)", "#a0a0a0",
      "#888888", "#da6871", "#93bb77", "#dfbb77",
      "#5caae9", "#c074d6", "oklch(80% 0.057 256.788)", "#b8b8b8",
    ],
    shikiTheme: "dracula",
    semantic: {
      accent: "oklch(70.4% 0.04 256.788)",
      accentHover: "oklch(80% 0.057 256.788)",
      muted: "#888888",
      surface: "#222222",
    },
  },
  "ZCSS Light": {
    background: "#f8f8f8",
    foreground: "#303030",
    cursor: "oklch(70.4% 0.04 256.788)",
    selectionBg: "#303030",
    selectionFg: "#f8f8f8",
    palette: [
      "#2a2a2a", "#bd4b53", "#266538", "#7a5218",
      "#3277c8", "#977acc", "oklch(70.4% 0.04 256.788)", "#707070",
      "#808080", "#9c2d3f", "#327e48", "#654516",
      "#5b99dc", "#b89ee7", "oklch(65% 0.027 256.788)", "#989898",
    ],
    shikiTheme: "github-light",
    semantic: {
      accent: "oklch(70.4% 0.04 256.788)",
      accentHover: "oklch(65% 0.027 256.788)",
      surface: "#eeeeee",
    },
  },
};
