import { useState } from "react";
import { colorSchemes, type ColorScheme } from "@/config/color-schemes";
import { schemeToCssPairs } from "@/config/color-scheme-utils";

const STORAGE_KEY = "zudo-doc-color-scheme";
const STORAGE_CSS_KEY = "zudo-doc-color-scheme-css";
const schemeNames = Object.keys(colorSchemes);

function applyScheme(scheme: ColorScheme) {
  const root = document.documentElement;
  for (const [prop, value] of schemeToCssPairs(scheme)) {
    root.style.setProperty(prop, value);
  }
}

export default function ColorSchemePicker() {
  const [current, setCurrent] = useState(() => {
    if (typeof window === "undefined") return schemeNames[0];
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && colorSchemes[saved] ? saved : schemeNames[0];
  });

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const name = e.target.value;
    const scheme = colorSchemes[name];
    if (!scheme) return;
    setCurrent(name);
    localStorage.setItem(STORAGE_KEY, name);
    localStorage.setItem(STORAGE_CSS_KEY, JSON.stringify(schemeToCssPairs(scheme)));
    applyScheme(scheme);
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      aria-label="Color scheme"
      className="bg-surface text-fg border border-muted px-hsp-sm py-vsp-2xs text-small focus:outline-2 focus:outline-accent focus:outline-offset-2"
    >
      {schemeNames.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>
  );
}
