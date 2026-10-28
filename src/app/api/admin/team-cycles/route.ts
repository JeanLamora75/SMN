import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {createScopedSprint} from "@/server/sprints/scoped-create";
import {createScopedKanbanPeriod} from "@/server/kanban/scoped-create";
import {MULTI_TEAM_CONTEXT_READY} from "@/lib/team-context-readiness";
import {resolveAdminTeam} from "@/server/teams/resolve";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"settings",exists:true,inScope:true} as const;

/** Read-only team cycle context. The client never chooses the mode or cadence revision. */
export async function GET(request:NextRequest){
 const actor=await authorizeApi(request,"read",resource);
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const params=request.nextUrl.searchParams;
 if([...params.keys()].some(key=>key!=="teamId")||params.getAll("teamId").length>1)
  return jsonResult({error:"invalid-input"},400);
 try{
  const data=await withAuthDb(async db=>{
   const team=await resolveAdminTeam(db,{accountId:actor.id,role:"admin"},params.get("teamId"));
   const table=team.mode==="scrum"?"public.smn_scrum_cadence":"public.smn_kanban_cadence";
   const cadence=await db.query<{revision:number}>(
    "SELECT revision FROM "+table+" WHERE team_id=$1",[team.team_id]);
   const revision=cadence.rows[0]?.revision;
   return {teamId:team.team_id,teamName:team.team,mode:team.mode,
    cadenceRevision:Number.isSafeInteger(revision)&&revision>0?revision:null,
    canCreate:MULTI_TEAM_CONTEXT_READY&&
     process.env.SMN_MULTI_TEAM_WRITES_ENABLED==="true"&&
     Number.isSafeInteger(revision)&&revision>0};
  });
  return jsonResult(data);
 }catch{
  return jsonResult({error:"team-context-unavailable"},404);
 }
}

/** Création préparée, gardée par le verrou de livraison et l'activation explicite. */
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 if(!MULTI_TEAM_CONTEXT_READY||
    process.env.SMN_MULTI_TEAM_WRITES_ENABLED!=="true")
  return jsonResult({error:"context-not-ready"},503);
 if(request.nextUrl.searchParams.size!==0)
  return jsonResult({error:"invalid-input"},400);
 const body=await readJsonObject(request,4096);
 if(!body||Object.keys(body).some(k=>!["mode","teamId","startOn","name","cadenceRevision"].includes(k))||
    (body.mode!=="scrum"&&body.mode!=="kanban"))
  return jsonResult({error:"invalid-input"},400);
 const {mode,...input}=body;
 try{
  const result=await withAuthDb(db=>mode==="scrum"?
   createScopedSprint(db,{accountId:actor.id,role:"admin"},input):
   createScopedKanbanPeriod(db,{accountId:actor.id,role:"admin"},input));
  if(result.ok)return jsonResult(result,201);
  return jsonResult({error:result.error},
   result.error==="invalid-input"?400:
   result.error==="overlap"||result.error==="stale-cadence"?409:400);
 }catch(error){
  if(error instanceof Error&&[
   "team-access-forbidden","team-context-unavailable","team-context-not-ready",
   "team-id-invalid","scrum-team-unavailable","kanban-team-unavailable"
  ].includes(error.message))return jsonResult({error:"not-found"},404);
  console.error("team-cycle-create-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
