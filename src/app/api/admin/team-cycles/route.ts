import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {MULTI_TEAM_CONTEXT_READY} from "@/lib/team-context-readiness";
import {createScopedSprint} from "@/server/sprints/scoped-create";
import {createScopedKanbanPeriod} from "@/server/kanban/scoped-create";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"settings",exists:true,inScope:true} as const;

/** Integration endpoint staged for final review. Not executable until global context readiness. */
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 if(!MULTI_TEAM_CONTEXT_READY||
    process.env.SMN_MULTI_TEAM_WRITES_ENABLED!=="true")
  return jsonResult({error:"context-not-ready"},503);
 if(request.nextUrl.searchParams.size!==0)return jsonResult({error:"invalid-input"},400);
 const body=await readJsonObject(request);
 if(!body||Object.keys(body).some(k=>!["mode","teamId","startOn","name","cadenceRevision"].includes(k))||
    (body.mode!=="scrum"&&body.mode!=="kanban"))
  return jsonResult({error:"invalid-input"},400);
 const {mode,...input}=body;
 try{
  const result=await withAuthDb(db=>mode==="scrum"?
   createScopedSprint(db,{accountId:actor.id,role:"admin"},input):
   createScopedKanbanPeriod(db,{accountId:actor.id,role:"admin"},input));
  if(!result.ok)return jsonResult(result,
   result.error==="overlap"||result.error==="stale-cadence"?409:400);
  return jsonResult(result,201);
 }catch{
  console.error("team-cycle-create-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
