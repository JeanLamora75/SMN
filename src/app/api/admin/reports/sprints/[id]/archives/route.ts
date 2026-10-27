import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyReportReadDb} from "@/server/reports/legacy-read";
import {jsonResult} from "@/server/auth/request";
import {listCyclePdfArchives,verifyArchiveIntegrity} from "@/server/reports/archive-index";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true}))return jsonResult({error:"forbidden"},403);
 const {id}=await params;if(!/^[a-f0-9-]{36}$/i.test(id))return jsonResult({error:"invalid-input"},400);
 try{
 const data=await withLegacyReportReadDb(async db=>{
 const scope=await db.query<{teamId:string}>(`SELECT s.team_id AS "teamId" FROM public.smn_sprint s
 JOIN public.smn_team t ON t.id=s.team_id JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE s.id=$1 AND s.deleted_at IS NULL AND i.id='singleton' AND i.state='initialized'
 AND lower(i.mode)='scrum'`,[id]);
 if(!scope.rows[0])return null;
 const items=await listCyclePdfArchives(db,id,scope.rows[0].teamId);
 return Promise.all(items.map(async item=>({...item,integrity:await verifyArchiveIntegrity(db,item.id)})));
 });
 return jsonResult(data??{error:"not-found"},data?200:404);
 }catch{return jsonResult({error:"unavailable"},503);}
}
