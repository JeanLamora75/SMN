import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {jsonResult} from "@/server/auth/request";
import {readAttention} from "@/server/registries/attention";
import {resolveRegistryReadContext} from "@/server/registries/team-access";

export const dynamic="force-dynamic";
export const runtime="nodejs";
export async function GET(req:NextRequest){
 const actor=await authorizeApi(req,"read",
  {type:"collective",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const p=req.nextUrl.searchParams;
 const cycleId=p.get("cycleId");
 if([...p.keys()].some(k=>!["teamId","cycleId"].includes(k))||
    p.getAll("teamId").length>1||p.getAll("cycleId").length>1||
    cycleId&&!/^[a-f0-9-]{36}$/i.test(cycleId))
  return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withSprintIndexDb(async db=>{
   const context=await resolveRegistryReadContext(db,
    {accountId:actor.id,role:actor.role},p.get("teamId"));
   let teamId=context.team?.team_id;
   if(!teamId){
    const teams=await db.query<{id:string}>(`
     SELECT t.id FROM public.smn_team t
     JOIN public.smn_installation i ON i.id=t.installation_id
     WHERE i.id='singleton' AND i.state='initialized'
      AND i.schema_version<=27 AND lower(i.mode) IN ('scrum','kanban')
     LIMIT 2`);
    if(teams.rows.length!==1)return {error:"unavailable"} as const;
    teamId=teams.rows[0].id;
   }
   if(cycleId){
    const scope=await db.query(`
     SELECT s.id FROM public.smn_sprint s
     WHERE s.id=$1 AND s.team_id=$2 AND s.deleted_at IS NULL`,
     [cycleId,teamId]);
    if(scope.rows.length!==1)return {error:"not-found"} as const;
   }
   const today=new Intl.DateTimeFormat("en-CA",{
    timeZone:"Europe/Paris",year:"numeric",month:"2-digit",day:"2-digit"
   }).format(new Date());
   return readAttention(db,teamId,cycleId,today);
  });
  return jsonResult(result,"error" in result?
   (result.error==="not-found"?404:503):
   result.state==="unavailable"?503:200);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
