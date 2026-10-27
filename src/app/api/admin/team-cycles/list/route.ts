import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult} from "@/server/auth/request";
import {resolveAdminTeam} from "@/server/teams/resolve";
import {parseSprintIndexQuery,readSprintIndex} from "@/server/sprints/index";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"collective",exists:true,inScope:true} as const;

/** Read-only, explicitly scoped cycle list. No DDL or lifecycle reconciliation. */
export async function GET(request:NextRequest){
 const actor=await authorizeApi(request,"read",resource);
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const params=request.nextUrl.searchParams;
 if(params.getAll("teamId").length!==1||
   [...params.keys()].some(k=>!["teamId","page","pageSize","search","status","sort"].includes(k))||
   [...new Set(params.keys())].some(k=>params.getAll(k).length!==1))
  return jsonResult({error:"invalid-input"},400);
 const teamId=params.get("teamId");
 if(!teamId)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(async db=>{
   const team=await resolveAdminTeam(db,{accountId:actor.id,role:"admin"},teamId);
   if(team.mode==="scrum"){
    const filters=new URLSearchParams(params);
    filters.delete("teamId");
    const options=parseSprintIndexQuery(filters);
    if(!options)return {error:"invalid-input" as const};
    const index=await readSprintIndex(db,options,{id:team.team_id,name:team.team});
    return {mode:"scrum" as const,teamId:team.team_id,...index};
   }
   // The Kanban list stays read-only and bound to the resolved team.
   if([...params.keys()].some(k=>k!=="teamId"))return {error:"invalid-input" as const};
   const exists=await db.query<{present:boolean}>(
    "SELECT to_regclass('public.smn_kanban_period') IS NOT NULL AS present");
   if(!exists.rows[0]?.present)
    return {mode:"kanban" as const,teamId:team.team_id,teamName:team.team,items:[]};
   const periods=await db.query<{id:string;name:string;startOn:string;endOn:string;status:string}>(`
    SELECT id,name,start_on::text AS "startOn",end_on::text AS "endOn",status
    FROM public.smn_kanban_period
    WHERE team_id=$1 AND deleted_at IS NULL ORDER BY start_on DESC,id DESC LIMIT 200`,[team.team_id]);
   return {mode:"kanban" as const,teamId:team.team_id,teamName:team.team,items:periods.rows};
  });
  return "error" in result?jsonResult(result,400):jsonResult(result);
 }catch{
  console.error("team-cycle-list-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
