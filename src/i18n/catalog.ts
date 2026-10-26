import fr from "./fr.json";
import en from "./en.json";
import memberFr from "./member-team-scope.fr.json";
import memberEn from "./member-team-scope.en.json";
import type {Language} from "@/lib/language";

type Paths<T> = { [K in keyof T & string]: T[K] extends string ? K :
  T[K] extends Record<string, unknown> ? `${K}.${Paths<T[K]>}` : never }[keyof T & string];
export type TranslationKey = Paths<typeof fr> | Paths<typeof memberFr>;
export type TranslationParams = Readonly<Record<string, string | number>>;
export const DEFAULT_LOCALE: Language = "fr";

const catalogs: Record<Language, Record<string, unknown>> = {
 fr:{...fr,...memberFr},en:{...en,...memberEn}
};
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

/** Backend setup exposes safe but French-language step labels for compatibility. */
export function translateBootstrapStep(locale:Language,step:string):string{
  const record=Object.entries(fr.welcome.steps).find(([,value])=>value===step);
  if(!record)return translate(locale,"welcome.unknownStep");
  return translate(locale,`welcome.steps.${record[0]}` as TranslationKey);
}
export function translateBootstrapError(locale:Language,error:string|null|undefined):string{
  if(!error || !Object.prototype.hasOwnProperty.call(fr.welcome.errors,error))
    return translate(locale,"welcome.interrupted");
  return translate(locale,`welcome.errors.${error}` as TranslationKey);
}
