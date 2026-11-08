import type {Client} from "pg";
import {listLinks,type LinkActor} from "@/server/links/catalog";

export const officeLinkSources=["LINKS_TRANSVERSE","LINKS_TEAM"] as const;
export type OfficeLinkSource=typeof officeLinkSources[number];
export type OfficeLinkLabel={token:string;url:string;label:string};
type Locale="fr"|"en";
type RecordRow=Record<string,string|null>;
type VisibleLink={id:string;title:string;url:string;description:string|null;
 scope:"TRANSVERSE"|"EQUIPE";teamId:string|null;categoryName:string};
const limit=10000;
const cmp=(a:string,b:string)=>a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase(),"fr");
export function buildOfficeLinkRows(links:readonly VisibleLink[],teamId:string,locale:Locale){
 const rows:{LINKS_TRANSVERSE:RecordRow[];LINKS_TEAM:RecordRow[]}={
  LINKS_TRANSVERSE:[],LINKS_TEAM:[]
 };
 const labels:OfficeLinkLabel[]=[];
 const ordered=[...links].filter(l=>l.scope==="TRANSVERSE"||
  (l.scope==="EQUIPE"&&l.teamId===teamId)).sort((a,b)=>
  cmp(a.categoryName,b.categoryName)||cmp(a.title,b.title)||cmp(a.id,b.id));
 if(ordered.length>limit)throw Error("office-links-resource-limit");
 for(const link of ordered){
  const source=link.scope==="TRANSVERSE"?"LINKS_TRANSVERSE":"LINKS_TEAM";
  const token="SMN_LINK_"+String(labels.length).padStart(6,"0")+"_LABEL";
  // URLs are never written into the visible label; OPC relationships are added after row expansion.
  labels.push({token,url:link.url,label:link.title});
  rows[source].push({
   LINK_TITLE:link.title,LINK_URL:link.url,LINK_LABEL:token,
   LINK_DESCRIPTION:link.description?.trim()||"N/D",
   LINK_CATEGORY:link.categoryName,
   LINK_SCOPE:link.scope==="TRANSVERSE"?
    (locale==="fr"?"Transverse":"Cross-team"):(locale==="fr"?"Équipe":"Team")
  });
 }
 return {rows,labels,counts:{
  LINK_COUNT_TRANSVERSE:String(rows.LINKS_TRANSVERSE.length),
  LINK_COUNT_TEAM:String(rows.LINKS_TEAM.length)
 }};
}
/** Read only the current actor/team-visible catalog. No report selection and no cross-team leak. */
export async function readOfficeLinkRows(db:Client,actor:LinkActor,teamId:string,locale:Locale){
 const visible=await listLinks(db,actor,teamId) as VisibleLink[];
 return buildOfficeLinkRows(visible,teamId,locale);
}
