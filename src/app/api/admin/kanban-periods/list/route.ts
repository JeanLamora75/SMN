import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult} from "@/server/auth/request";
import {resolveAdminTeam} from "@/server/teams/resolve";
import {evaluateSchemaCapability} from "@/server/schema/compatibility";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
 const actor=await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 try{return jsonResult(await withAuthDb(async db=>{
  const present=await db.query<{ready:boolean}>("SELECT to_regclass('public.smn_kanban_period') IS NOT NULL AS ready");
  if(!present.rows[0]?.ready)throw Error("kanban-schema-unavailable");
  const version=await db.query<{schema_version:number}>("SELECT schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'");
  const schema=version.rows[0]?.schema_version??0;
  let scopedTeamId:string|null=null;
  if(evaluateSchemaCapability(schema,"multi-team").ok){
   const team=await resolveAdminTeam(db,{accountId:actor.id,role:actor.role},req.nextUrl.searchParams.get("teamId"));
   if(team.mode!=="kanban")throw Error("team-not-kanban");
   scopedTeamId=team.team_id;
  }else if(schema<1||schema>27)throw Error("schema-invalid");
  const result=await db.query<{id:string;name:string;start_on:string;end_on:string;status:string}>(`SELECT p.id,p.name,p.start_on::text,p.end_on::text,p.status
   FROM public.smn_kanban_period p JOIN public.smn_team t ON t.id=p.team_id
   JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE i.id='singleton' AND i.state='initialized' AND lower(COALESCE(NULLIF(to_jsonb(t)->>'agile_mode',''),i.mode))='kanban' AND p.deleted_at IS NULL
     AND ($1::text IS NULL OR p.team_id=$1)
   ORDER BY p.start_on DESC,p.id DESC LIMIT 200`,[scopedTeamId]);
  return {periods:result.rows.map(p=>({id:p.id,name:p.name,startOn:p.start_on,endOn:p.end_on,status:p.status}))};
 }));}catch{return jsonResult({error:"service-unavailable"},503);}
}
