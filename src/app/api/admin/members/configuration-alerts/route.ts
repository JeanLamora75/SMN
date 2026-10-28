import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult} from "@/server/auth/request";
import {resolveAdminTeam} from "@/server/teams/resolve";
import {listTeamMembers} from "@/server/members/quick-create";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"members",exists:true,inScope:true} as const;

/** Projection minimale et bornée ; aucune fiche ni historique personnel n'est exposé. */
export async function GET(request:NextRequest){
 const actor=await authorizeApi(request,"read",resource);
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const params=request.nextUrl.searchParams;
 if([...params.keys()].some(key=>key!=="teamId")||params.getAll("teamId").length>1)
  return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(async db=>{
   const team=await resolveAdminTeam(db,{accountId:actor.id,role:"admin"},params.get("teamId"));
   const roster=await listTeamMembers(db,{id:team.team_id,name:team.team,
    mode:team.mode as "scrum"|"kanban"});
   const active=roster.members.filter(m=>!m.archived&&m.isAssigned);
   if(!active.length)return {warnings:[]};
   const ids=active.map(m=>m.id);
   const weeks=await db.query<{member_id:string}>(`
    SELECT DISTINCT member_id FROM public.smn_member_calendar_week
    WHERE member_id=ANY($1::text[]) AND effective_from<=CURRENT_DATE`,[ids]);
   const configured=new Set(weeks.rows.map(r=>r.member_id));
   return {warnings:active.map(m=>({
    id:m.id,name:m.displayName,
    missingCalendar:!configured.has(m.id),
    missingRoles:![m.roleShares.scrumMaster,m.roleShares.productOwner,
     m.roleShares.developer].some(v=>Number.isFinite(v)&&v>0)
   })).filter(m=>m.missingCalendar||m.missingRoles)};
  });
  return jsonResult(result);
 }catch{
  console.error("smn-member-configuration-alerts-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
