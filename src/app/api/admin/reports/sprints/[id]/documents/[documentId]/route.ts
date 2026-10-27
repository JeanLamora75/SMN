import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {readTeamStudioDocument,saveTeamStudioDocument} from "@/server/reports/team-studio";
import {withLegacyReportReadDb} from "@/server/reports/legacy-read";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {getReportDocument,updateReportDocument} from "@/server/reports/report-documents";
export const dynamic="force-dynamic";export const runtime="nodejs";
type Params={params:Promise<{id:string;documentId:string}>};
export async function GET(req:NextRequest,{params}:Params){
 const reader=await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true});
 if(!reader)
 return jsonResult({error:"forbidden"},403);
 const {id,documentId}=await params;
 const teamId=req.nextUrl.searchParams.get("teamId");
 if(teamId&&reader.role!=="admin")return jsonResult({error:"forbidden"},403);
 try{const result=teamId?await withAuthDb(db=>readTeamStudioDocument(db,{accountId:reader.id,role:reader.role},teamId,id,documentId)):await withLegacyReportReadDb(db=>getReportDocument(db,id,documentId));
 return jsonResult(result??{error:"not-found"},result?200:404);}
 catch{return jsonResult({error:"unavailable"},503);}
}
export async function PATCH(req:NextRequest,{params}:Params){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {id,documentId}=await params,body=await readJsonObject(req);
 if(!body)return jsonResult({error:"invalid-input"},400);
 const teamId=req.nextUrl.searchParams.get("teamId");
 if(teamId&&actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 try{const result=teamId?await withAuthDb(db=>saveTeamStudioDocument(db,{accountId:actor.id,role:actor.role},teamId,id,documentId,body)):await withLegacyTeamApi(db=>updateReportDocument(db,actor.id,id,documentId,body));
 return jsonResult(result,result.ok?200:result.error==="stale"?409:result.error==="not-found"?404:400);}
 catch{return jsonResult({error:"unavailable"},503);}
}
