import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {listInstallationTeams} from "@/server/teams/list";
import {createInstallationTeam,updateInstallationTeam,setTeamArchived,type TeamWriteResult}
 from "@/server/teams/write";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const settings={type:"settings",exists:true,inScope:true} as const;

/** L'activation est indépendante de la migration : ne pas exposer les écritures
 * avant la qualification des lecteurs et exports multiéquipes.
 */
export const teamWritesEnabled=()=>process.env.SMN_MULTI_TEAM_WRITES_ENABLED==="true";

async function accountInstallation(db:import("pg").Client,accountId:string){
 const result=await db.query<{installation_id:string}>(
  "SELECT installation_id FROM public.smn_account "+
  "WHERE id=$1 AND role='admin' AND is_active=true AND must_change_password=false",
  [accountId]);
 return result.rows.length===1?result.rows[0].installation_id:null;
}
function statusOf(result:TeamWriteResult):number{
 if(result.ok)return 200;
 if(result.error==="forbidden")return 403;
 if(result.error==="not-found")return 404;
 if(["duplicate-name","conflict","has-cycles","last-active-team","archived-team"].includes(result.error))return 409;
 if(result.error==="schema-not-ready")return 503;
 return 400;
}

/** Liste de l'installation autorisée. L'état canWrite est uniquement informatif :
 * les requêtes d'écriture revérifient indépendamment rôle et schéma.
 */
export async function GET(request:NextRequest){
 const actor=await authorizeApi(request,"read",settings);
 if(!actor)return jsonResult({error:"forbidden"},403);
 if(request.nextUrl.searchParams.size!==0)return jsonResult({error:"invalid-input"},400);
 try{
  const data=await withAuthDb(async db=>{
   const installationId=await accountInstallation(db,actor.id);
   if(!installationId)return null;
   const state=await db.query<{schema_version:number;state:string}>(
    "SELECT schema_version,state FROM public.smn_installation WHERE id=$1",
    [installationId]);
   return {items:await listInstallationTeams(db,installationId),
    canWrite:teamWritesEnabled()&&state.rows[0]?.state==="initialized"&&
      [28,29,30,31].includes(state.rows[0]?.schema_version??-1)};
  });
  return data?jsonResult(data):jsonResult({error:"forbidden"},403);
 }catch{
  console.error("teams-list-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}

/** Actuellement fermé par défaut même si la base a déjà été migrée. */
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",settings);
 if(!actor)return jsonResult({error:"forbidden"},403);
 if(!teamWritesEnabled())return jsonResult({error:"schema-not-ready"},503);
 const input=await readJsonObject(request,48000);
 if(!input)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(async db=>{
   const installationId=await accountInstallation(db,actor.id);
   return installationId?createInstallationTeam(db,installationId,actor.id,input):
    {ok:false as const,error:"forbidden" as const};
  });
  return jsonResult(result,result.ok?201:statusOf(result));
 }catch(error){
  if((error as {code?:unknown})?.code==="23505")
   return jsonResult({error:"conflict"},409);
  console.error("teams-create-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
export async function PATCH(request:NextRequest){
 const actor=await authorizeApi(request,"write",settings);
 if(!actor)return jsonResult({error:"forbidden"},403);
 if(!teamWritesEnabled())return jsonResult({error:"schema-not-ready"},503);
 const input=await readJsonObject(request,48000);
 if(!input)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(async db=>{
   const installationId=await accountInstallation(db,actor.id);
   return installationId?(Object.keys(input).sort().join(",")==="archived,revision,teamId"?
    setTeamArchived(db,installationId,actor.id,input):
    updateInstallationTeam(db,installationId,actor.id,input)):
    {ok:false as const,error:"forbidden" as const};
  });
  return jsonResult(result,statusOf(result));
 }catch(error){
  if((error as {code?:unknown})?.code==="23505")
   return jsonResult({error:"conflict"},409);
  const code=(error&&typeof error==="object"&&"code" in error&&typeof error.code==="string")?error.code:"unknown";
  console.error("teams-edit-unavailable",code,error instanceof Error?error.message:"unknown");
  return jsonResult({error:"service-unavailable"},503);
 }
}
