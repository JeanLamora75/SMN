import {readFile} from "node:fs/promises";
import path from "node:path";
import {helpCatalog,type HelpMode} from "@/lib/help-catalog";
import type {AccessActor} from "@/server/access-policy";

export type HelpSearchHit=Readonly<{id:string;title:string;score:number}>;
export type HelpSearchResponse=Readonly<{status:"ready";hits:readonly HelpSearchHit[]}|
 {status:"unavailable";hits:readonly []}>;

const LOCALE=/^[a-z]{2,3}(?:-[a-z]{2})?$/;
const ID=/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
export function normalizeHelpQuery(value:string):string{
 return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").trim().replace(/\s+/g," ");
}
export function rankHelpSearch(
 query:string,
 entries:readonly Readonly<{id:string;title:string;searchText:string}>[],
 permitted:ReadonlySet<string>
):HelpSearchHit[]{
 const term=normalizeHelpQuery(query).slice(0,120);
 const words=term.split(" ").filter(Boolean);
 if(!words.length)return [];
 return entries.flatMap(entry=>{
  if(!permitted.has(entry.id)||!ID.test(entry.id))return [];
  const title=normalizeHelpQuery(entry.title);
  const body=entry.searchText;
  if(!words.every(word=>title.includes(word)||body.includes(word)))return [];
  const score=(title===term?40:0)+(title.includes(term)?15:0)+
   words.reduce((total,word)=>total+(title.includes(word)?8:0)+
    (body.includes(word)?1:0),0);
  return [{id:entry.id,title:entry.title,score}];
 }).sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title)||a.id.localeCompare(b.id));
}

/** The index is generated during build; only the active locale is read. No DB or external fetch. */
export async function searchHelp(
 query:string,locale:string,actor:AccessActor|null|undefined,mode:HelpMode|null,
 root:string=path.join(process.cwd(),"content/help/.index")
):Promise<HelpSearchResponse>{
 if(!LOCALE.test(locale))return {status:"unavailable",hits:[]};
 const permitted=new Set(helpCatalog(actor,mode).map(article=>article.id));
 try{
  const raw=JSON.parse(await readFile(path.join(root,locale+".json"),"utf8")) as unknown;
  if(!raw||typeof raw!=="object"||!Array.isArray((raw as {articles?:unknown}).articles)||
   (raw as {locale?:unknown}).locale!==locale||
   (raw as {version?:unknown}).version!==1)throw Error("invalid-help-index");
  const entries=(raw as {articles:unknown[]}).articles;
  if(!entries.every(entry=>!!entry&&typeof entry==="object"&&
   typeof (entry as {id?:unknown}).id==="string"&&
   typeof (entry as {title?:unknown}).title==="string"&&
   typeof (entry as {searchText?:unknown}).searchText==="string"))
   throw Error("invalid-help-index-entries");
  return {status:"ready",hits:rankHelpSearch(query,entries as {id:string;title:string;searchText:string}[],permitted)};
 }catch{
  return {status:"unavailable",hits:[]};
 }
}
