import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {lunchForTeam,updateLunch} from "@/server/sprints/lunch";
export const dynamic="force-dynamic";
async function team(db:import("pg").Client){const r=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t JOIN public.smn_installation i ON t.installation_id=i.id WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum'`);if(r.rows.length!==1)throw Error("scrum-team-unavailable");return r.rows[0].id;}
export async function GET(req:NextRequest){
 if(!await authorizeApi(req,"read",{type:"settings",exists:true,inScope:true}))return jsonResult({error:"forbidden"},403);
 try{return jsonResult({lunch:await withLegacyTeamApi(async db=>lunchForTeam(db,await team(db)))});}
 catch{return jsonResult({error:"unavailable"},503);}
}
export async function PATCH(req:NextRequest){
 if(!await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true}))return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req);if(!body)return jsonResult({error:"invalid-input"},400);
 try{const result=await withLegacyTeamApi(async db=>updateLunch(db,await team(db),body));return jsonResult(result,result.ok?200:result.error==="conflict"?409:400);}
 catch{return jsonResult({error:"unavailable"},503);}
}
