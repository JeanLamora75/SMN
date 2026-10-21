/** Seuls les deux thèmes contrastés et leurs palettes figées sont autorisés. */
export type Theme="light"|"dark";
export function parseTheme(value:unknown):Theme {
  return value==="dark"?"dark":"light";
}
export const themePalette={
  light:{background:"#f5f7fb",surface:"#ffffff",foreground:"#15233b",brand:"#154d8d"},
  dark:{background:"#101827",surface:"#1a2638",foreground:"#eef3fb",brand:"#85baff"},
} as const satisfies Record<Theme,Record<string,string>>;
