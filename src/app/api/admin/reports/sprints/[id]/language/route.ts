import {NextRequest} from "next/server";
import {withTeamReportCycle} from "@/server/reports/team-cycle";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {withLegacyReportReadDb} from "@/server/reports/legacy-read";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {readReportLanguage,saveReportLanguage} from "@/server/reports/language";
export const dynamic="force-dynamic";
const scope={type:"settings",exists:true,inScope:true} as const;
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const reader=await authorizeApi(req,"write",scope);
 if(!reader)return jsonResult({error:"forbidden"},403);
 const {id}=await params;if(!/^[a-f0-9-]{36}$/i.test(id))return jsonResult({error:"invalid-input"},400);
 const teamId=req.nextUrl.searchParams.get("teamId");
 if(teamId&&reader.role!=="admin")return jsonResult({error:"forbidden"},403);
 try{const data=teamId?await withTeamReportCycle({accountId:reader.id,role:reader.role},teamId,id,db=>readReportLanguage(db,id)):await withLegacyReportReadDb(async db=>{
 const row=await db.query(`SELECT s.id FROM public.smn_sprint s JOIN public.smn_team t ON t.id=s.team_id
 JOIN public.smn_installation i ON i.id=t.installation_id WHERE s.id=$1 AND s.deleted_at IS NULL
 AND i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum'`,[id]);
 return row.rows.length?readReportLanguage(db,id):null;});
 return jsonResult(data??{error:"not-found"},data?200:404);
 }catch{return jsonResult({error:"unavailable"},503);}
}
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",scope);if(!actor)return jsonResult({error:"forbidden"},403);
 const {id}=await params,body=await readJsonObject(req);
 if(!body)return jsonResult({error:"invalid-input"},400);
 const teamId=req.nextUrl.searchParams.get("teamId");
 if(teamId&&actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 try{const result=teamId?await withTeamReportCycle({accountId:actor.id,role:actor.role},teamId,id,db=>saveReportLanguage(db,id,actor.id,body)):await withLegacyTeamApi(db=>saveReportLanguage(db,id,actor.id,body));
 if(!result)return jsonResult({error:"not-found"},404);
 return jsonResult(result,result.ok?200:result.error==="not-found"?404:result.error==="conflict"?409:400);
 }catch{return jsonResult({error:"unavailable"},503);}
}
