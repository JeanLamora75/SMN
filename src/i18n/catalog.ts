import fr from "./fr.json";
import en from "./en.json";
import type {Language} from "@/lib/language";

type Paths<T> = { [K in keyof T & string]: T[K] extends string ? K :
  T[K] extends Record<string, unknown> ? `${K}.${Paths<T[K]>}` : never }[keyof T & string];
export type TranslationKey = Paths<typeof fr>;
export type TranslationParams = Readonly<Record<string, string | number>>;
export const DEFAULT_LOCALE: Language = "fr";

const catalogs: Record<Language, Record<string, unknown>> = {fr,en};
function find(locale: Language,key:string):string | undefined {
  let node:unknown = catalogs[locale];
  for(const part of key.split(".")) {
    if(!node || typeof node !== "object" || Array.isArray(node) ||
       !Object.prototype.hasOwnProperty.call(node,part))return undefined;
    node=(node as Record<string,unknown>)[part];
  }
  return typeof node === "string" && node.length>0 ? node : undefined;
}
/** Pure formatter; consume its return as React text, never raw HTML. */
export function translate(locale:Language,key:TranslationKey,
  params:TranslationParams={}):string {
  const effective=locale==="en"?"en":DEFAULT_LOCALE;
  const source=find(effective,key)??find(DEFAULT_LOCALE,key)??
    find(effective,"common.translationUnavailable")??fr.common.translationUnavailable;
  return source.replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g,
    (_match,name:string)=>Object.prototype.hasOwnProperty.call(params,name)?String(params[name]):"");
}
