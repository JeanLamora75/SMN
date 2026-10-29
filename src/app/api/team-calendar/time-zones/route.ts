import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult} from "@/server/auth/request";
import {resolveAdminTeam} from "@/server/teams/resolve";
export const dynamic="force-dynamic";
/** Only distinct time zones are exposed, not individual member locations. */
export async function GET(req:NextRequest){
 const actor=await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 try{
  const zones=await withAuthDb(async db=>{
   const version=await db.query<{schema_version:number}>("SELECT schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'");
   const schema=version.rows[0]?.schema_version??0;
   let teamId:string;
   if(schema>=28&&schema<=32){
    const team=await resolveAdminTeam(db,{accountId:actor.id,role:actor.role},req.nextUrl.searchParams.get("teamId"));
    teamId=team.team_id;
   }else if(schema>=1&&schema<=27){
    const teams=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t JOIN public.smn_installation i ON i.id=t.installation_id WHERE i.id='singleton' AND i.state='initialized' AND i.mode IN ('scrum','kanban') LIMIT 2`);
    if(teams.rows.length!==1)throw Error("team-unavailable");
    teamId=teams.rows[0].id;
   }else throw Error("schema-invalid");
   const result=await db.query<{time_zone:string}>(`SELECT DISTINCT latest.time_zone FROM public.smn_member_assignment a
   JOIN public.smn_member m ON m.id=a.member_id AND m.archived_at IS NULL
   JOIN LATERAL (SELECT l.time_zone FROM public.smn_member_location l WHERE l.member_id=m.id AND l.effective_from<=CURRENT_DATE ORDER BY l.effective_from DESC,l.revision DESC LIMIT 1) latest ON true
   WHERE a.team_id=$1 AND a.start_on<=CURRENT_DATE AND (a.end_on IS NULL OR a.end_on>=CURRENT_DATE) AND latest.time_zone IS NOT NULL
   ORDER BY latest.time_zone`,[teamId]);
   return result.rows.map(r=>r.time_zone).filter(z=>{try{new Intl.DateTimeFormat("en",{timeZone:z});return true;}catch{return false;}});
  });
  return jsonResult({timeZones:[...new Set(zones)]});
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
