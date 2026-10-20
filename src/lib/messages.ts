import "server-only";
import {headers} from "next/headers";
import {negotiateLanguage,type Language} from "./language";
import {translate,type TranslationKey} from "@/i18n/catalog";
import type {DiagnosticStatus} from "@/server/installation/diagnostic";
export type {Language} from "./language";
/** Legacy facade kept for callers not yet migrated to SMN-27. */
export async function browserLanguage():Promise<Language>{
  return negotiateLanguage((await headers()).get("accept-language"));
}
const codes:DiagnosticStatus[]=[
  "configuration-missing","configuration-invalid","configuration-key-missing","database-missing",
  "connection-error","permissions-insufficient","server-version-unsupported",
  "virgin","initialized","schema-incompatible","installation-incomplete",
];
function dictionary(locale:Language):Record<DiagnosticStatus,string>{
  return Object.fromEntries(codes.map(code=>
    [code,translate(locale,`installation.diagnostic.${code}` as TranslationKey)])) as Record<DiagnosticStatus,string>;
}
export const translations={fr:dictionary("fr"),en:dictionary("en")};
