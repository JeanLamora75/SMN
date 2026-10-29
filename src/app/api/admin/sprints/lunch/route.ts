import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {withAuthDb} from "@/server/auth/database";
import {lunchForTeam,updateLunch} from "@/server/sprints/lunch";
import {resolveAdminTeam} from "@/server/teams/resolve";
export const dynamic="force-dynamic";

async function team(db:import("pg").Client,actor:{id:string;role:"admin"|"user"},requested?:string|null){
 const result=await db.query<{schema_version:number}>(`SELECT schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'`);
 const version=result.rows[0]?.schema_version;
 if(version!==undefined&&version>=28&&version<=32){
  const selected=await resolveAdminTeam(db,{accountId:actor.id,role:actor.role},requested);
  if(selected.mode!=="scrum")throw Error("scrum-team-unavailable");
  return selected.team_id;
 }
 if(version===undefined||version>27)throw Error("team-schema-unavailable");
 const r=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t JOIN public.smn_installation i ON t.installation_id=i.id WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum'`);
 if(r.rows.length!==1||requested&&requested!==r.rows[0].id)throw Error("scrum-team-unavailable");
 return r.rows[0].id;
}
export async function GET(req:NextRequest){
 const actor=await authorizeApi(req,"read",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 try{return jsonResult(await withAuthDb(async db=>{
  const teamId=await team(db,actor,req.nextUrl.searchParams.get("teamId"));
  return {teamId,lunch:await lunchForTeam(db,teamId)};
 }));}
 catch{return jsonResult({error:"unavailable"},503);}
}
export async function PATCH(req:NextRequest){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req);if(!body)return jsonResult({error:"invalid-input"},400);
 const {teamId:requestedTeamId,...lunch}=body;
 if(requestedTeamId!==undefined&&typeof requestedTeamId!=="string")return jsonResult({error:"invalid-input"},400);
 try{const result=await withAuthDb(async db=>{
  const teamId=await team(db,actor,requestedTeamId);
  return updateLunch(db,teamId,lunch);
 });return jsonResult(result,result.ok?200:result.error==="conflict"?409:400);}
 catch{return jsonResult({error:"unavailable"},503);}
}
