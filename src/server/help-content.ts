import {readFile} from "node:fs/promises";
import path from "node:path";
import {helpResourcesRoot} from "./help-path";
import {helpArticleById,type HelpMode} from "@/lib/help-catalog";
import type {AccessActor} from "@/server/access-policy";

/** Localized bodies are deliberately independent of the global UI i18n catalogs. */
export type HelpContentResult=
 |Readonly<{status:"ready";articleId:string;requestedLocale:string;contentLocale:string;isFallback:boolean;markdown:string}>
 |Readonly<{status:"not-found"|"forbidden"|"unavailable";articleId:string;requestedLocale:string}>;

const ID=/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const LOCALE=/^[a-z]{2,3}(?:-[a-z]{2})?$/;
const DEFAULT_ROOT=helpResourcesRoot();

/**
 * Reads one permitted article at a time. No wildcard imports, SQL or HTTP.
 * The caller must derive actor and mode from trusted server-side state.
 */
export async function loadHelpContent(
 articleId:string,requestedLocale:string,actor:AccessActor|null|undefined,mode:HelpMode|null,
 contentRoot:string=DEFAULT_ROOT
):Promise<HelpContentResult>{
 const locale=requestedLocale.toLowerCase();
 if(!ID.test(articleId)||!LOCALE.test(locale))
  return {status:"not-found",articleId,requestedLocale:locale};
 if(!helpArticleById(articleId,actor,mode))
  return {status:"forbidden",articleId,requestedLocale:locale};
 const read=async(lang:string):Promise<string|null>=>{
  try{return await readFile(path.join(contentRoot,lang,articleId+".md"),"utf8");}
  catch(error){
   if((error as NodeJS.ErrnoException).code==="ENOENT")return null;
   throw error;
  }
 };
 try{
  const selected=await read(locale);
  if(selected!==null)return {status:"ready",articleId,requestedLocale:locale,contentLocale:locale,isFallback:false,markdown:selected};
  if(locale!=="fr"){
   const fallback=await read("fr");
   if(fallback!==null)return {status:"ready",articleId,requestedLocale:locale,contentLocale:"fr",isFallback:true,markdown:fallback};
  }
  return {status:"unavailable",articleId,requestedLocale:locale};
 }catch{
  return {status:"unavailable",articleId,requestedLocale:locale};
 }
}

/** User-facing message must disclose fallback rather than silently mislabel the content. */
export function helpContentNotice(result:HelpContentResult):string|null{
 if(result.status==="ready"){
  if(!result.isFallback)return null;
  return result.requestedLocale==="en"
   ?"This article is not yet translated into English. The French version is shown."
   :result.requestedLocale==="fr"?null
    :"Cette aide n'est pas encore traduite dans la langue sélectionnée ; la version française est affichée.";
 }
 if(result.status==="forbidden")return "Cette aide n'est pas accessible avec vos droits.";
 if(result.status==="unavailable")return "Cet article d'aide est momentanément indisponible.";
 return "Aucun article d'aide ne correspond à cette demande.";
}
