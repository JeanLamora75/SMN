import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult} from "@/server/auth/request";
import {readKanbanCadence} from "@/server/kanban/cadence";
import {batchPreview} from "@/server/kanban/batch-preview";
import {resolveAdminTeam} from "@/server/teams/resolve";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 const actor=await authorizeApi(request,"read",{type:"collective",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const params=new URL(request.url).searchParams;
 const startOn=params.get("startOn")??"";
 const quantity=Number(params.get("quantity"));
 if(!params.has("quantity")||!Number.isInteger(quantity)||quantity<1||quantity>6)return jsonResult({error:"invalid-quantity"},400);
 try{
  const result=await withAuthDb(async db=>{
   const team=await resolveAdminTeam(db,{accountId:actor.id,role:actor.role},params.get("teamId"));
   if(team.mode!=="kanban")throw Error("kanban-team-unavailable");
   const cadence=await readKanbanCadence(db,{accountId:actor.id,role:actor.role},team.team_id);
   const present=await db.query<{ready:boolean}>("SELECT to_regclass('public.smn_kanban_period') IS NOT NULL AS ready");
   if(!present.rows[0]?.ready)throw Error("kanban-schema-unavailable");
   const r=await db.query<{id:string;start_on:string;end_on:string}>(`SELECT p.id,p.start_on::text,p.end_on::text
    FROM public.smn_kanban_period p JOIN public.smn_team t ON t.id=p.team_id
    JOIN public.smn_installation i ON i.id=t.installation_id
    WHERE i.id='singleton' AND i.state='initialized' AND p.team_id=$1 AND p.deleted_at IS NULL`,[team.team_id]);
   return {cadenceRevision:cadence.revision,...batchPreview(startOn,quantity,cadence.frequency,
    r.rows.map(x=>({id:x.id,startOn:x.start_on,endOn:x.end_on})))};
  });
  return jsonResult(result);
 }catch(error){
  if(error instanceof Error&&["invalid-date","invalid-quantity","monthly-start-must-be-first"].includes(error.message))
   return jsonResult({error:error.message},400);
  return jsonResult({error:"service-unavailable"},503);
 }
}
