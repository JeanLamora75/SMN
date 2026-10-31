/** Palette strictement prédéfinie : jamais de couleurs arbitraires persistées. */
export const PALETTES=["ocean","forest","violet","red-purple"] as const;
export type Palette=(typeof PALETTES)[number];
export type Theme="light"|"dark";
export type Appearance=Readonly<{theme:Theme;palette:Palette}>;
export const DEFAULT_APPEARANCE:Appearance={theme:"light",palette:"ocean"};
export function validPalette(input:unknown):input is Palette {
  return PALETTES.some(palette=>palette===input);
}
export function safeAppearance(theme:unknown,palette:unknown):Appearance{
  return {theme:theme==="light"||theme==="dark"?theme:DEFAULT_APPEARANCE.theme,
    palette:validPalette(palette)?palette:DEFAULT_APPEARANCE.palette};
}
