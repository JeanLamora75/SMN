import {NextRequest} from "next/server";
import {withAuthDb} from "@/server/auth/database";
import {readTeamStudioDocument} from "@/server/reports/team-studio";
import {compareTemplateVersions} from "@/server/reports/template-versioning";
import {listReportTemplates} from "@/server/reports/templates";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult} from "@/server/auth/request";
import {withLegacyReportReadDb} from "@/server/reports/legacy-read";
import {readTemplateUpdateOffer} from "@/server/reports/template-versioning";
export const dynamic="force-dynamic";export const runtime="nodejs";
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string;documentId:string}>}){
 const actor=await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {id,documentId}=await params;
 if(!/^[a-f0-9-]{36}$/i.test(id)||!/^[a-f0-9-]{36}$/i.test(documentId))
 return jsonResult({error:"invalid-input"},400);
 try{
 const teamId=req.nextUrl.searchParams.get("teamId");
 if(teamId&&actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const result=teamId?await withAuthDb(async db=>{
  const doc=await readTeamStudioDocument(db,{accountId:actor.id,role:actor.role},teamId,id,documentId);
  if(!doc)return null;
  const snapshot=(doc.content as {templateSnapshot?:{id:string;revision:number;sections:any;content:any}}|null)?.templateSnapshot;
  if(!snapshot||snapshot.id!==doc.templateId||snapshot.revision!==doc.templateVersion)return {available:false,reason:"snapshot-unavailable"};
  const latest=(await listReportTemplates(db)).find(t=>t.id===doc.templateId);
  if(!latest||latest.revision<=doc.templateVersion)return {available:false,reason:"up-to-date"};
  return {available:true,comparison:compareTemplateVersions(snapshot,latest)};
 }):await withLegacyReportReadDb(db=>readTemplateUpdateOffer(db,id,documentId));
 return jsonResult(result??{error:"not-found"},result?200:404);
 }catch{return jsonResult({error:"unavailable"},503);}
}
