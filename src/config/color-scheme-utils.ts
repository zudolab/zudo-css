import { colorSchemes, type ColorScheme } from "./color-schemes";
import { settings } from "./settings";

export function getActiveScheme(): ColorScheme {
  const scheme = colorSchemes[settings.colorScheme];
  if (!scheme) {
    throw new Error(`Unknown color scheme: "${settings.colorScheme}". Available: ${Object.keys(colorSchemes).join(", ")}`);
  }
  return scheme;
}

/** Resolve semantic colors with fallbacks to default palette slots */
export function resolveSemanticColors(scheme: ColorScheme) {
  return {
    surface: scheme.semantic?.surface ?? scheme.palette[0],
    muted: scheme.semantic?.muted ?? scheme.palette[8],
    accent: scheme.semantic?.accent ?? scheme.palette[6],
    accentHover: scheme.semantic?.accentHover ?? scheme.palette[14],
    codeBg: scheme.semantic?.codeBg ?? scheme.foreground,
    codeFg: scheme.semantic?.codeFg ?? scheme.background,
    success: scheme.semantic?.success ?? scheme.palette[2],
    danger: scheme.semantic?.danger ?? scheme.palette[1],
    warning: scheme.semantic?.warning ?? scheme.palette[3],
    info: scheme.semantic?.info ?? scheme.palette[4],
  };
}

export function schemeToCssPairs(scheme: ColorScheme): [string, string][] {
  const sem = resolveSemanticColors(scheme);
  return [
    ["--zd-bg", scheme.background],
    ["--zd-fg", scheme.foreground],
    ["--zd-cursor", scheme.cursor],
    ["--zd-sel-bg", scheme.selectionBg],
    ["--zd-sel-fg", scheme.selectionFg],
    ...scheme.palette.map((color, i) => [`--zd-${i}`, color] as [string, string]),
    ["--zd-surface", sem.surface],
    ["--zd-muted", sem.muted],
    ["--zd-accent", sem.accent],
    ["--zd-accent-hover", sem.accentHover],
    ["--zd-code-bg", sem.codeBg],
    ["--zd-code-fg", sem.codeFg],
    ["--zd-success", sem.success],
    ["--zd-danger", sem.danger],
    ["--zd-warning", sem.warning],
    ["--zd-info", sem.info],
  ];
}

export function generateCssCustomProperties(): string {
  const scheme = getActiveScheme();
  const pairs = schemeToCssPairs(scheme);
  const lines = [":root {", ...pairs.map(([prop, value]) => `  ${prop}: ${value};`), "}"];
  return lines.join("\n");
}

export function generateLightDarkCssProperties(): string {
  if (!settings.colorMode) {
    throw new Error("colorMode is not configured");
  }
  const { lightScheme, darkScheme } = settings.colorMode;
  const light = colorSchemes[lightScheme];
  const dark = colorSchemes[darkScheme];
  if (!light) throw new Error(`Unknown light scheme: "${lightScheme}"`);
  if (!dark) throw new Error(`Unknown dark scheme: "${darkScheme}"`);

  const lightPairs = schemeToCssPairs(light);
  const darkPairs = schemeToCssPairs(dark);

  if (lightPairs.length !== darkPairs.length) {
    throw new Error(`Light scheme has ${lightPairs.length} properties but dark scheme has ${darkPairs.length}`);
  }

  const lines = [":root {", "  color-scheme: light dark;"];
  for (let i = 0; i < lightPairs.length; i++) {
    const prop = lightPairs[i][0];
    const lightVal = lightPairs[i][1];
    const darkVal = darkPairs[i][1];
    lines.push(`  ${prop}: light-dark(${lightVal}, ${darkVal});`);
  }
  lines.push("}");
  return lines.join("\n");
}
