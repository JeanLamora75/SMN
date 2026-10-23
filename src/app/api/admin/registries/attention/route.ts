import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {jsonResult} from "@/server/auth/request";
import {readAttention} from "@/server/registries/attention";
export const dynamic="force-dynamic";export const runtime="nodejs";
export async function GET(req:NextRequest){
 if(!await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true}))return jsonResult({error:"forbidden"},403);
 const cycleId=req.nextUrl.searchParams.get("cycleId");
 if(cycleId&&!/^[a-f0-9-]{36}$/i.test(cycleId))return jsonResult({error:"invalid-input"},400);
 try{const result=await withSprintIndexDb(async db=>{
  const team=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode) IN ('scrum','kanban')`);
  if(team.rows.length!==1)return {error:"unavailable"};
  if(cycleId){
   const scope=await db.query(`SELECT 1 FROM public.smn_sprint s WHERE s.id=$1 AND s.team_id=$2 AND s.deleted_at IS NULL`,[cycleId,team.rows[0].id]);
   if(scope.rows.length!==1)return {error:"not-found"};
  }
  const today=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Paris",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  return readAttention(db,team.rows[0].id,cycleId,today);
 });return jsonResult(result,"error" in result?404:200);}
 catch{return jsonResult({error:"service-unavailable"},503);}
}
