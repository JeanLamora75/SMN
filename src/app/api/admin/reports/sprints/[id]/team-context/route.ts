import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {withLegacyReportReadDb} from "@/server/reports/legacy-read";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {readTeamContextChoices,saveTeamContextChoices} from "@/server/reports/team-context-options";
import {readTeamReportContext} from "@/server/reports/team-context-read";
export const dynamic="force-dynamic";export const runtime="nodejs";
const target={type:"settings",exists:true,inScope:true} as const;
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!await authorizeApi(req,"write",target))return jsonResult({error:"forbidden"},403);
 const {id}=await params;if(!/^[a-f0-9-]{36}$/i.test(id))return jsonResult({error:"invalid-input"},400);
 try{
 const data=await withLegacyReportReadDb(async db=>{
 const scope=await db.query<{teamId:string}>(`SELECT s.team_id AS "teamId" FROM public.smn_sprint s
 JOIN public.smn_team t ON t.id=s.team_id JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE s.id=$1 AND s.deleted_at IS NULL AND i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum'`,[id]);
 if(scope.rows.length!==1)return null;
 const [choices,sources]=await Promise.all([readTeamContextChoices(db,id),readTeamReportContext(db,scope.rows[0].teamId)]);
 return {...choices,sources};
 });return jsonResult(data??{error:"not-found"},data?200:404);
 }catch{return jsonResult({error:"unavailable"},503);}
}
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",target);if(!actor)return jsonResult({error:"forbidden"},403);
 const {id}=await params;const input=await readJsonObject(req);
 if(!input)return jsonResult({error:"invalid-input"},400);
 try{const r=await withLegacyTeamApi(db=>saveTeamContextChoices(db,id,actor.id,input));
 return jsonResult(r,r.ok?200:r.error==="not-found"?404:r.error==="conflict"?409:400);
 }catch{return jsonResult({error:"unavailable"},503);}
}
