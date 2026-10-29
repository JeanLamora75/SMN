import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult} from "@/server/auth/request";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {readSprintContext} from "@/server/sprints/context";
import {resolveAdminTeam} from "@/server/teams/resolve";
import {evaluateSchemaCapability} from "@/server/schema/compatibility";

export const dynamic="force-dynamic";
export const runtime="nodejs";

/** v27 conserve la sélection monoéquipe historique.
 * v28 exige le compte Admin et vérifie l'appartenance du teamId explicite
 * ou la préférence personnelle ; jamais de choix arbitraire de première équipe.
 */
export async function GET(request:NextRequest){
 const actor=await authorizeApi(request,"read",
  {type:"collective",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const params=request.nextUrl.searchParams;
 if([...params.keys()].some(k=>k!=="teamId")||params.getAll("teamId").length>1)
  return jsonResult({error:"invalid-input"},400);
 const requested=params.get("teamId");
 try{
  const result=await withSprintIndexDb(async db=>{
   const version=await db.query<{schema_version:number}>(`
    SELECT schema_version FROM public.smn_installation
    WHERE id='singleton' AND state='initialized'`);
   if(version.rows.length!==1)throw Error("sprint-context-unavailable");
   if(evaluateSchemaCapability(version.rows[0].schema_version,"multi-team").ok){
    const context=await resolveAdminTeam(db,
      {accountId:actor.id,role:actor.role},requested);
    if(context.mode!=="scrum")throw Error("sprint-context-mode-invalid");
    return readSprintContext(db,context.team_id);
   }
   if(version.rows[0].schema_version>27)throw Error("sprint-context-schema-invalid");
   const rows=await db.query<{id:string}>(`
    SELECT t.id FROM public.smn_team t
    JOIN public.smn_installation i ON i.id=t.installation_id
    WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum'`);
   if(rows.rows.length!==1||
      (requested!==null&&rows.rows[0].id!==requested))
    throw Error("sprint-context-unavailable");
   return readSprintContext(db,rows.rows[0].id);
  });
  return jsonResult(result);
 }catch{
  console.error("sprint-context-read-failed");
  return jsonResult({error:"service-unavailable"},503);
 }
}
