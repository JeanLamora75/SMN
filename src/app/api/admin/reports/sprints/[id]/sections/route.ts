import {NextRequest} from "next/server";
import {withTeamReportCycle} from "@/server/reports/team-cycle";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyReportReadDb} from "@/server/reports/legacy-read";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {readReportSectionOptions,saveReportSectionOptions} from "@/server/reports/section-options";
export const dynamic="force-dynamic";export const runtime="nodejs";
const target={type:"settings",exists:true,inScope:true} as const;
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const reader=await authorizeApi(req,"write",target);
 if(!reader)return jsonResult({error:"forbidden"},403);
 const {id}=await params;if(!/^[a-f0-9-]{36}$/i.test(id))return jsonResult({error:"invalid-input"},400);
 const teamId=req.nextUrl.searchParams.get("teamId");
 if(teamId&&reader.role!=="admin")return jsonResult({error:"forbidden"},403);
 try{const result=teamId?await withTeamReportCycle({accountId:reader.id,role:reader.role},teamId,id,db=>readReportSectionOptions(db,id)):await withLegacyReportReadDb(async db=>{
 const scope=await db.query(`SELECT s.id FROM public.smn_sprint s JOIN public.smn_team t ON t.id=s.team_id JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE s.id=$1 AND s.deleted_at IS NULL AND i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum'`,[id]);
 return scope.rows.length?readReportSectionOptions(db,id):null;
 });return jsonResult(result??{error:"not-found"},result?200:404);}
 catch{return jsonResult({error:"unavailable"},503);}
}
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",target);if(!actor)return jsonResult({error:"forbidden"},403);
 const {id}=await params;const body=await readJsonObject(req);if(!body)return jsonResult({error:"invalid-input"},400);
 const teamId=req.nextUrl.searchParams.get("teamId");
 if(teamId&&actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 try{const result=teamId?await withTeamReportCycle({accountId:actor.id,role:actor.role},teamId,id,db=>saveReportSectionOptions(db,actor.id,id,body)):await withLegacyTeamApi(db=>saveReportSectionOptions(db,actor.id,id,body));
 if(!result)return jsonResult({error:"not-found"},404);
 return jsonResult(result,result.ok?200:result.error==="conflict"?409:result.error==="not-found"?404:400);}
 catch{return jsonResult({error:"unavailable"},503);}
}
