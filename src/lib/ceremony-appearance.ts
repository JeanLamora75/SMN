import {isDashboardIcon} from "./dashboard-builder/icon-catalog";

/** Couleurs des pictogrammes de cérémonies, sans valeur CSS arbitraire. */
export const CEREMONY_ICON_COLORS = [
 {id:"blue",label:"Bleu",hex:"#175cd3"},
 {id:"teal",label:"Turquoise",hex:"#087f8c"},
 {id:"green",label:"Vert",hex:"#207245"},
 {id:"amber",label:"Ambre",hex:"#986000"},
 {id:"orange",label:"Orange",hex:"#b54c11"},
 {id:"red",label:"Rouge",hex:"#b42335"},
 {id:"purple",label:"Violet",hex:"#7040ae"},
 {id:"pink",label:"Rose",hex:"#a62c75"},
 {id:"slate",label:"Ardoise",hex:"#45556c"},
] as const;
export type CeremonyIconColor=(typeof CEREMONY_ICON_COLORS)[number]["id"];
export function isCeremonyIconColor(value:unknown):value is CeremonyIconColor {
 return typeof value==="string"&&CEREMONY_ICON_COLORS.some(c=>c.id===value);
}
export function ceremonyIconColorHex(value:unknown):string|undefined{
 return CEREMONY_ICON_COLORS.find(c=>c.id===value)?.hex;
}
export function validateCeremonyAppearance(icon:unknown,color:unknown):boolean{
 return (icon===null||icon===undefined||isDashboardIcon(icon))&&
  (color===null||color===undefined||isCeremonyIconColor(color));
}
