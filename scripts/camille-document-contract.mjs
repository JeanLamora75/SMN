import {readFile,stat} from "node:fs/promises";
import path from "node:path";

const ARTICLE_ID=/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const LOCALE=/^[a-z]{2,3}(?:-[a-z]{2})?$/;
const ISO_DATE=/^\d{4}-\d{2}-\d{2}$/;

export async function validateCamilleDraft({
 root=process.cwd(),articleId,locale,markdown,evidence
}){
 if(typeof articleId!=="string"||!ARTICLE_ID.test(articleId)||
    typeof locale!=="string"||!LOCALE.test(locale))
  throw Error("camille-invalid-article-or-locale");
 const catalog=await readFile(path.join(root,"src/lib/help-catalog.ts"),"utf8");
 const ids=new Set([...catalog.matchAll(/\{id:"([a-z][a-z0-9-]*)",section:/g)].map(m=>m[1]));
 if(!ids.has(articleId))throw Error("camille-article-id-not-in-catalog");
 if(typeof markdown!=="string"||!/^# [^\n]+\n/m.test(markdown)||!/^## [^\n]+/m.test(markdown))
  throw Error("camille-invalid-markdown-structure");
 if(/<script\b|javascript:|data:text\/html|(?<!\w)https?:\/\//i.test(markdown)||
    /\]\((?:[^/)]|\/\/)/.test(markdown))
  throw Error("camille-nonlocal-or-active-link");
 // No personal email addresses or credential-shaped examples in published guides.
 if(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(markdown)||
    /\b(?:Bearer\s+[A-Za-z0-9._~-]{12,}|gh[pousr]_[A-Za-z0-9_]{15,}|sk-[A-Za-z0-9_-]{16,})\b/i.test(markdown))
  throw Error("camille-private-content");
 const paths=[...markdown.matchAll(/\]\((\/app(?:\/[a-z0-9-]+)*)\)/g)].map(m=>m[1]);
 for(const route of paths){
  const relative=route==="/app"?"":route.slice("/app/".length);
  const routePath=path.join(root,"src/app/app",relative,"page.tsx");
  try{if(!(await stat(routePath)).isFile())throw Error("not-a-file");}
  catch{throw Error("camille-route-unverified:"+route);}
 }
 if(!Array.isArray(evidence)||evidence.length===0)throw Error("camille-evidence-missing");
 for(const claim of evidence){
  if(typeof claim?.claim!=="string"||!claim.claim.trim()||
     claim.status!=="vérifié"||
     !ISO_DATE.test(claim.verifiedAt)||!Array.isArray(claim.sources)||
     claim.sources.length===0)
   throw Error("camille-unattested-claim");
  for(const source of claim.sources){
   if(typeof source!=="string"||!source.startsWith("src/")||
      source.includes("..")||path.isAbsolute(source))
    throw Error("camille-invalid-source");
   try{if(!(await stat(path.join(root,source))).isFile())throw Error("not-a-file");}
   catch{throw Error("camille-source-unverified:"+source);}
  }
 }
 // This is a pre-publication contract. Real UX observations and CI status
 // must still be confirmed separately; presence of a source is not execution.
 return {articleId,locale,links:paths.length,claims:evidence.length};
}
