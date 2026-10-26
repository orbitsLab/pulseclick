/**
 * Theme gallery.
 *
 * Provides 40+ themes and custom list backgrounds to personalize the workspace.
 *
 * A theme is a small palette that is published as CSS custom properties on
 * `document.documentElement`, so every surface in the app picks it up.
 */

export interface ThemePalette {
  /** Accent used for primary actions, focus rings and selection. */
  accent: string;
  /** Text colour that sits on the accent. */
  accentContrast: string;
  /** Accent adjusted so accent-coloured *text* stays legible on the panel. */
  accentText: string;
  /** Darker accent for filled controls that carry white text. */
  accentStrong: string;
  /** App background. */
  bg: string;
  /** Raised surfaces: panels, cards, sidebars. */
  panel: string;
  /** Slightly raised surface (hover states, inputs). */
  panelAlt: string;
  /** Primary text. */
  text: string;
  /** Secondary text. */
  muted: string;
  /** Hairlines and dividers. */
  border: string;
  /** Sidebar / module rail background. */
  rail: string;
}

function mixHex(hex: string, target: string, weight: number): string {
  const parse = (value: string) => {
    const clean = value.replace("#", "");
    const full =
      clean.length === 3
        ? clean
            .split("")
            .map((c) => c + c)
            .join("")
        : clean;
    return [
      parseInt(full.slice(0, 2), 16),
      parseInt(full.slice(2, 4), 16),
      parseInt(full.slice(4, 6), 16),
    ];
  };
  const a = parse(hex);
  const b = parse(target);
  const mixed = a.map((channel, i) =>
    Math.round(channel * (1 - weight) + b[i] * weight)
      .toString(16)
      .padStart(2, "0")
  );
  return `#${mixed.join("")}`;
}

export interface Theme {
  id: string;
  name: string;
  mode: "light" | "dark";
  palette: ThemePalette;
}

const light = (p: Partial<ThemePalette>): ThemePalette => ({
  accent: "#4772fa",
  accentContrast: "#ffffff",
  accentText: "#3b60d8",
  accentStrong: "#3e64dc",
  bg: "#f7f8fa",
  panel: "#ffffff",
  panelAlt: "#f2f4f8",
  text: "#191919",
  muted: "#7c8496",
  border: "#e6e9f0",
  rail: "#ffffff",
  ...p,
});

const dark = (p: Partial<ThemePalette>): ThemePalette => ({
  accent: "#4772fa",
  accentContrast: "#ffffff",
  accentText: "#7b9dfb",
  accentStrong: "#3e64dc",
  bg: "#0f1115",
  panel: "#171a21",
  panelAlt: "#1f232c",
  text: "#eef1f6",
  muted: "#8b94a7",
  border: "#262b36",
  rail: "#12151b",
  ...p,
});

const RAW_THEMES: Theme[] = [
  // --- Light ------------------------------------------------------------
  { id: "flow-blue", name: "Flow Blue", mode: "light", palette: light({}) },
  { id: "classic-grey", name: "Classic Grey", mode: "light", palette: light({ accent: "#6b7280", rail: "#f2f3f5" }) },
  { id: "sunset", name: "Sunset", mode: "light", palette: light({ accent: "#f2683c", accentContrast: "#ffffff", panelAlt: "#fff3ee", border: "#ffe0d3" }) },
  { id: "mint", name: "Mint", mode: "light", palette: light({ accent: "#12b886", panelAlt: "#e9faf3", border: "#d3f2e6" }) },
  { id: "ocean", name: "Ocean", mode: "light", palette: light({ accent: "#1c7ed6", panelAlt: "#eaf3fc", border: "#d6e8f8" }) },
  { id: "grape", name: "Grape", mode: "light", palette: light({ accent: "#7950f2", panelAlt: "#f1ebfe", border: "#e4dafd" }) },
  { id: "rose", name: "Rose", mode: "light", palette: light({ accent: "#e64980", panelAlt: "#fdeef4", border: "#fbdce8" }) },
  { id: "amber", name: "Amber", mode: "light", palette: light({ accent: "#f59f00", accentContrast: "#ffffff", panelAlt: "#fff7e0", border: "#fcebc4" }) },
  { id: "emerald", name: "Emerald", mode: "light", palette: light({ accent: "#0ca678", panelAlt: "#e7f8f1", border: "#cdeedf" }) },
  { id: "crimson", name: "Crimson", mode: "light", palette: light({ accent: "#e03131", panelAlt: "#fdecec", border: "#f8d7d7" }) },
  { id: "indigo", name: "Indigo", mode: "light", palette: light({ accent: "#3b5bdb", panelAlt: "#ecefff", border: "#dbe1fb" }) },
  { id: "teal", name: "Teal", mode: "light", palette: light({ accent: "#0c8599", panelAlt: "#e5f6f9", border: "#d0ecf1" }) },
  { id: "forest", name: "Forest", mode: "light", palette: light({ accent: "#2f9e44", panelAlt: "#eaf7ec", border: "#d5f0da" }) },
  { id: "coffee", name: "Coffee", mode: "light", palette: light({ accent: "#8d6e4a", panelAlt: "#f4efe9", border: "#e8ddd0" }) },
  { id: "lavender", name: "Lavender", mode: "light", palette: light({ accent: "#9775fa", panelAlt: "#f2eeff", border: "#e5dcff" }) },
  { id: "slate", name: "Slate", mode: "light", palette: light({ accent: "#495057", panelAlt: "#eef0f3", border: "#dfe3e8" }) },
  { id: "cherry", name: "Cherry", mode: "light", palette: light({ accent: "#d6336c", panelAlt: "#fdeaf1", border: "#f9d3e0" }) },
  { id: "sky", name: "Sky", mode: "light", palette: light({ accent: "#4dabf7", panelAlt: "#ebf6ff", border: "#d6ebff" }) },
  { id: "lime", name: "Lime", mode: "light", palette: light({ accent: "#74b816", panelAlt: "#f1f9e3", border: "#e2f1c6" }) },
  { id: "sand", name: "Sand", mode: "light", palette: light({ accent: "#c99a3c", panelAlt: "#fbf5e8", border: "#f0e3c9" }) },

  // --- Dark -------------------------------------------------------------
  { id: "midnight", name: "Midnight", mode: "dark", palette: dark({}) },
  { id: "carbon", name: "Carbon", mode: "dark", palette: dark({ accent: "#868e96", panelAlt: "#20242c", border: "#2b303a" }) },
  { id: "nebula", name: "Nebula", mode: "dark", palette: dark({ accent: "#845ef7", panelAlt: "#241f3d", border: "#2f2850" }) },
  { id: "deep-sea", name: "Deep Sea", mode: "dark", palette: dark({ accent: "#22b8cf", panelAlt: "#122f38", border: "#19404c" }) },
  { id: "forest-night", name: "Forest Night", mode: "dark", palette: dark({ accent: "#51cf66", panelAlt: "#132a1a", border: "#1b3a25" }) },
  { id: "ember", name: "Ember", mode: "dark", palette: dark({ accent: "#ff922b", panelAlt: "#2f2114", border: "#402c1b" }) },
  { id: "rosewood", name: "Rosewood", mode: "dark", palette: dark({ accent: "#f783ac", panelAlt: "#331d27", border: "#452633" }) },
  { id: "royal", name: "Royal", mode: "dark", palette: dark({ accent: "#5c7cfa", panelAlt: "#1a2038", border: "#252d4d" }) },
  { id: "graphite", name: "Graphite", mode: "dark", palette: dark({ accent: "#74c0fc", panelAlt: "#1c222a", border: "#272e38" }) },
  { id: "plum", name: "Plum", mode: "dark", palette: dark({ accent: "#da77f2", panelAlt: "#2b1d31", border: "#3a2742" }) },
  { id: "matrix", name: "Matrix", mode: "dark", palette: dark({ accent: "#40c057", accentContrast: "#0b120c", panelAlt: "#102415", border: "#173320" }) },
  { id: "mocha", name: "Mocha", mode: "dark", palette: dark({ accent: "#c58f6a", panelAlt: "#2b211b", border: "#3a2c23" }) },
  { id: "steel", name: "Steel", mode: "dark", palette: dark({ accent: "#4dabf7", panelAlt: "#161d26", border: "#1f2934" }) },
  { id: "noir", name: "Noir", mode: "dark", palette: dark({ accent: "#e9ecef", accentContrast: "#11131a", panelAlt: "#14171d", border: "#1d212a", text: "#f1f3f5" }) },
  { id: "aubergine", name: "Aubergine", mode: "dark", palette: dark({ accent: "#b197fc", panelAlt: "#241f33", border: "#312a45" }) },
  { id: "teal-night", name: "Teal Night", mode: "dark", palette: dark({ accent: "#20c997", panelAlt: "#102622", border: "#17332e" }) },
  { id: "sunset-dark", name: "Sunset Dark", mode: "dark", palette: dark({ accent: "#ff6b6b", panelAlt: "#2e1a1c", border: "#3e2326" }) },
  { id: "indigo-night", name: "Indigo Night", mode: "dark", palette: dark({ accent: "#748ffc", panelAlt: "#1a1f33", border: "#252c47" }) },
  { id: "gold", name: "Gold", mode: "dark", palette: dark({ accent: "#ffd43b", accentContrast: "#1a1500", panelAlt: "#2b2513", border: "#3b3319" }) },
  { id: "arctic", name: "Arctic", mode: "light", palette: light({ accent: "#3bc9db", panelAlt: "#e6f9fc", border: "#cdeff5" }) },
  { id: "peach", name: "Peach", mode: "light", palette: light({ accent: "#ff922b", panelAlt: "#fff4e6", border: "#ffe8cc" }) },
  { id: "sage", name: "Sage", mode: "light", palette: light({ accent: "#8aa89c", panelAlt: "#eef4f1", border: "#dde8e3" }) },
  { id: "violet", name: "Violet", mode: "light", palette: light({ accent: "#7048e8", panelAlt: "#f0ecfd", border: "#e0d8fb" }) },
  { id: "sandstone", name: "Sandstone", mode: "light", palette: light({ accent: "#b08968", panelAlt: "#f6efe9", border: "#e9ddd1" }) },
  { id: "terminal", name: "Terminal", mode: "dark", palette: dark({ accent: "#51cf66", accentContrast: "#04140a", bg: "#05070a", panel: "#0a0e13", panelAlt: "#10161d", border: "#182029", rail: "#070a0e" }) },
  { id: "nord", name: "Nord", mode: "dark", palette: dark({ accent: "#88c0d0", panelAlt: "#1c222b", border: "#252d38" }) },
  { id: "dracula", name: "Dracula", mode: "dark", palette: dark({ accent: "#bd93f9", panelAlt: "#241f31", border: "#312a45" }) },
  { id: "solarized", name: "Solarized", mode: "light", palette: light({ accent: "#268bd2", bg: "#fdf6e3", panel: "#fbf4e4", panelAlt: "#f3ecd8", border: "#eee8d5", rail: "#f5eedc" }) },
  { id: "grayscale", name: "Grayscale", mode: "light", palette: light({ accent: "#4a4a4a", panelAlt: "#efefef", border: "#e0e0e0", rail: "#f5f5f5" }) },
  { id: "pastel", name: "Pastel", mode: "light", palette: light({ accent: "#f783ac", panelAlt: "#fdf0f6", border: "#f8dbe8" }) },
  { id: "high-contrast", name: "High Contrast", mode: "light", palette: light({ accent: "#000000", accentContrast: "#ffffff", bg: "#ffffff", panel: "#ffffff", panelAlt: "#f0f0f0", text: "#000000", muted: "#404040", border: "#000000", rail: "#ffffff" }) },
  { id: "midnight-purple", name: "Midnight Purple", mode: "dark", palette: dark({ accent: "#9775fa", bg: "#100d18", panel: "#191428", panelAlt: "#221b36", border: "#2c2444", rail: "#141020" }) },
  { id: "seafoam", name: "Seafoam", mode: "dark", palette: dark({ accent: "#63e6be", panelAlt: "#102620", border: "#17342c" }) },
  { id: "copper", name: "Copper", mode: "dark", palette: dark({ accent: "#e5995e", panelAlt: "#2b2018", border: "#3a2b20" }) },
  { id: "slate-blue", name: "Slate Blue", mode: "dark", palette: dark({ accent: "#6a8caf", panelAlt: "#1a2028", border: "#242c36" }) },
  { id: "lemon", name: "Lemon", mode: "light", palette: light({ accent: "#e8b923", panelAlt: "#fffbe8", border: "#f6efc9" }) },
  { id: "olive", name: "Olive", mode: "light", palette: light({ accent: "#7a8b3a", panelAlt: "#f1f4e6", border: "#e2e8d0" }) },
];

export const THEMES: Theme[] = RAW_THEMES.map((theme) => ({
  ...theme,
  palette: {
    ...theme.palette,
    // Accent-coloured text needs to be darker on light surfaces and lighter on
    // dark ones to stay legible; filled controls need a darker accent so white
    // text clears 4.5:1.
    accentText:
      theme.mode === "dark"
        ? mixHex(theme.palette.accent, "#ffffff", 0.25)
        : mixHex(theme.palette.accent, "#000000", 0.18),
    accentStrong: mixHex(theme.palette.accent, "#000000", 0.12),
  },
}));

export const THEME_MAP: Record<string, Theme> = Object.fromEntries(
  THEMES.map((t) => [t.id, t])
);

export const DEFAULT_THEME_ID = "midnight";

export function getTheme(id: string | null | undefined): Theme {
  return THEME_MAP[id ?? ""] ?? THEME_MAP[DEFAULT_THEME_ID];
}

export const THEME_CSS_VARS: Array<[keyof ThemePalette, string]> = [
  ["accent", "--app-accent"],
  ["accentContrast", "--app-accent-contrast"],
  ["accentText", "--app-accent-text"],
  ["accentStrong", "--app-accent-strong"],
  ["bg", "--app-bg"],
  ["panel", "--app-panel"],
  ["panelAlt", "--app-panel-alt"],
  ["text", "--app-text"],
  ["muted", "--app-muted"],
  ["border", "--app-border"],
  ["rail", "--app-rail"],
];

/** Publish a theme onto an element (defaults to `document.documentElement`). */
export function applyTheme(themeId: string | null | undefined, root?: HTMLElement) {
  const theme = getTheme(themeId);
  const target = root ?? (typeof document !== "undefined" ? document.documentElement : null);
  if (!target) return theme;
  for (const [key, cssVar] of THEME_CSS_VARS) {
    target.style.setProperty(cssVar, theme.palette[key]);
  }
  target.dataset.appTheme = theme.id;
  target.dataset.appMode = theme.mode;
  target.classList.toggle("dark", theme.mode === "dark");
  return theme;
}

export interface ListBackground {
  id: string;
  name: string;
  /** CSS gradient or solid colour applied behind the list header. */
  css: string;
}

export const LIST_BACKGROUNDS: ListBackground[] = [
  { id: "none", name: "None", css: "transparent" },
  { id: "paper", name: "Paper", css: "linear-gradient(135deg,#fdf6e3,#f7ecd7)" },
  { id: "sky", name: "Sky", css: "linear-gradient(135deg,#e8f4ff,#d6e9ff)" },
  { id: "meadow", name: "Meadow", css: "linear-gradient(135deg,#e9f9ef,#d6f2e0)" },
  { id: "blossom", name: "Blossom", css: "linear-gradient(135deg,#fdeef4,#fbdce8)" },
  { id: "twilight", name: "Twilight", css: "linear-gradient(135deg,#e7e9ff,#d7dcff)" },
  { id: "sunset", name: "Sunset", css: "linear-gradient(135deg,#fff1e6,#ffe0cc)" },
  { id: "graphite", name: "Graphite", css: "linear-gradient(135deg,#eceef2,#dfe3ea)" },
  { id: "slate", name: "Slate", css: "linear-gradient(135deg,#e7ebf0,#d8dee7)" },
  { id: "mint", name: "Mint", css: "linear-gradient(135deg,#e6faf3,#d0f2e5)" },
  { id: "lavender", name: "Lavender", css: "linear-gradient(135deg,#f3eeff,#e4dbff)" },
  { id: "peach", name: "Peach", css: "linear-gradient(135deg,#fff0e6,#ffe0cd)" },
  { id: "charcoal", name: "Charcoal", css: "linear-gradient(135deg,#2a2f38,#1c2027)" },
  { id: "midnight", name: "Midnight", css: "linear-gradient(135deg,#232a44,#171d33)" },
  { id: "forest", name: "Forest", css: "linear-gradient(135deg,#20402c,#14291d)" },
  { id: "dusk", name: "Dusk", css: "linear-gradient(135deg,#3d2a4a,#251a2e)" },
  { id: "checker", name: "Checker", css: "repeating-linear-gradient(45deg,#eef1f5 0 10px,#e2e7ee 10px 20px)" },
  { id: "dots", name: "Dots", css: "radial-gradient(#cfd6e0 1px, transparent 1px) 0 0/14px 14px" },
  { id: "lines", name: "Lines", css: "repeating-linear-gradient(0deg,#eef1f5 0 1px,transparent 1px 22px)" },
  { id: "mesh", name: "Mesh", css: "radial-gradient(at 20% 20%,#dbe7ff 0,transparent 45%),radial-gradient(at 80% 0,#ffe3ef 0,transparent 40%),radial-gradient(at 50% 80%,#dcf7ec 0,transparent 45%)" },
];

export const LIST_BACKGROUND_MAP: Record<string, ListBackground> = Object.fromEntries(
  LIST_BACKGROUNDS.map((b) => [b.id, b])
);

export function getListBackground(id: string | null | undefined): ListBackground {
  return LIST_BACKGROUND_MAP[id ?? ""] ?? LIST_BACKGROUND_MAP.none;
}
