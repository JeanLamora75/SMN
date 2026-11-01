import type {Client} from "pg";

export type CycleType="scrum"|"kanban";
export type ManualChange=Readonly<{indicatorId:string;value:string|null}>;
export type ManualWrite=Readonly<{teamId:string;cycleType:CycleType;cycleId:string;expectedRevision:number;changes:readonly ManualChange[]}>;
export type ManualWriteResult=
 |Readonly<{ok:true;revision:number}>
 |Readonly<{ok:false;error:"invalid-input"|"forbidden"|"not-found"|"conflict"|"indicator-unavailable"}>;
export type TeamWriteAuthorization=(actorId:string,teamId:string,db:Client)=>Promise<boolean>;
export class ManualWriteError extends Error {constructor(message:string){super(message);this.name="ManualWriteError";}}

const idValid=(v:unknown):v is string=>typeof v==="string"&&v.length>0&&v.length<=160;
const numericValid=(v:unknown):v is string|null=>v===null||
 typeof v==="string"&&/^[+-]?(?:0|[0-9]+)(?:\.[0-9]+)?$/.test(v)&&
 v.replace(/^[+-]/,"").split(".")[0].length<=48&&
 (v.split(".")[1]?.length??0)<=24;
export function validateManualWrite(input:ManualWrite):boolean{
 if(!input||!idValid(input.teamId)||!idValid(input.cycleId)||
  !["scrum","kanban"].includes(input.cycleType)||
  !Number.isSafeInteger(input.expectedRevision)||input.expectedRevision<0||
  !Array.isArray(input.changes)||input.changes.length<1||input.changes.length>100)return false;
 const ids=new Set<string>();
 for(const item of input.changes){
  if(!item||!idValid(item.indicatorId)||!numericValid(item.value)||ids.has(item.indicatorId))return false;
  ids.add(item.indicatorId);
 }
 return true;
}
/** Caller must authenticate actorId server-side; never pass an authorization result from the browser. */
export async function writeManualValues(
 db:Client,actorId:string,input:ManualWrite,canWriteTeam?:TeamWriteAuthorization
):Promise<ManualWriteResult>{
 if(!idValid(actorId)||!validateManualWrite(input))return {ok:false,error:"invalid-input"};
 await db.query("BEGIN");
 try{
  const installation=await db.query<{schema_version:number}>(
   "SELECT schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'");
  if(installation.rows[0]?.schema_version!==33){await db.query("ROLLBACK");return {ok:false,error:"not-found"};}
  const actor=await db.query<{role:string}>(
   "SELECT role FROM public.smn_account WHERE id=$1 AND installation_id='singleton' AND is_active=true",
   [actorId]);
  if(!actor.rows[0]){await db.query("ROLLBACK");return {ok:false,error:"forbidden"};}
  if(actor.rows[0].role!=="admin"&&(!canWriteTeam||!await canWriteTeam(actorId,input.teamId,db))){
   await db.query("ROLLBACK");return {ok:false,error:"forbidden"};
  }
  // All indicator writers acquire the global lock before cycle-local locks.
  const global=await db.query<{revision:string}>(
   "SELECT revision::text FROM public.smn_indicator_system_revision WHERE singleton_key='singleton' FOR UPDATE");
  if(!global.rows[0])throw new ManualWriteError("global-revision-missing");
  const table=input.cycleType==="scrum"?"smn_sprint":"smn_kanban_period";
  const cycle=await db.query<{id:string}>(
   "SELECT c.id FROM public."+table+" c JOIN public.smn_team t ON t.id=c.team_id "+
   "WHERE c.id=$1 AND c.team_id=$2 AND c.deleted_at IS NULL "+
   "AND COALESCE(t.is_archived,false)=false AND t.agile_mode=$3 FOR UPDATE OF c",
   [input.cycleId,input.teamId,input.cycleType]);
  if(!cycle.rows[0]){await db.query("ROLLBACK");return {ok:false,error:"not-found"};}
  const ids=input.changes.map(v=>v.indicatorId);
  const allowed=await db.query<{id:string}>(
   "SELECT d.id FROM public.smn_indicator_definition d "+
   "JOIN public.smn_indicator_team_selection s ON s.indicator_id=d.id "+
   "WHERE s.team_id=$1 AND s.is_active=true AND d.archived_at IS NULL "+
   "AND d.indicator_type='manual' AND d.id=ANY($2::text[])",
   [input.teamId,ids]);
  if(allowed.rows.length!==ids.length){
   await db.query("ROLLBACK");return {ok:false,error:"indicator-unavailable"};
  }
  await db.query(
   "INSERT INTO public.smn_indicator_cycle_revision(team_id,cycle_type,cycle_id,revision) "+
   "VALUES($1,$2,$3,0) ON CONFLICT (team_id,cycle_type,cycle_id) DO NOTHING",
   [input.teamId,input.cycleType,input.cycleId]);
  const revision=await db.query<{revision:string}>(
   "SELECT revision::text FROM public.smn_indicator_cycle_revision "+
   "WHERE team_id=$1 AND cycle_type=$2 AND cycle_id=$3 FOR UPDATE",
   [input.teamId,input.cycleType,input.cycleId]);
  const current=Number(revision.rows[0]?.revision);
  if(!Number.isSafeInteger(current))throw new ManualWriteError("cycle-revision-invalid");
  if(current!==input.expectedRevision){
   await db.query("ROLLBACK");return {ok:false,error:"conflict"};
  }
  for(const change of input.changes){
   await db.query(
    "INSERT INTO public.smn_indicator_manual_value "+
    "(team_id,cycle_type,cycle_id,indicator_id,value,updated_by) VALUES($1,$2,$3,$4,$5::numeric,$6) "+
    "ON CONFLICT (team_id,cycle_type,cycle_id,indicator_id) DO UPDATE SET "+
    "value=EXCLUDED.value,updated_by=EXCLUDED.updated_by,updated_at=now()",
    [input.teamId,input.cycleType,input.cycleId,change.indicatorId,change.value,actorId]);
  }
  await db.query("UPDATE public.smn_indicator_cycle_revision SET revision=revision+1,updated_at=now() "+
   "WHERE team_id=$1 AND cycle_type=$2 AND cycle_id=$3",
   [input.teamId,input.cycleType,input.cycleId]);
  await db.query("UPDATE public.smn_indicator_system_revision SET revision=revision+1,updated_at=now() "+
   "WHERE singleton_key='singleton'");
  await db.query("COMMIT");
  return {ok:true,revision:current+1};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
export async function readManualCycleValues(db:Client,teamId:string,cycleType:CycleType,cycleId:string){
 if(!idValid(teamId)||!idValid(cycleId)||!["scrum","kanban"].includes(cycleType))
  throw new ManualWriteError("invalid-scope");
 const [revision,values]=await Promise.all([
  db.query<{revision:string}>("SELECT revision::text FROM public.smn_indicator_cycle_revision WHERE team_id=$1 AND cycle_type=$2 AND cycle_id=$3",[teamId,cycleType,cycleId]),
  db.query<{indicator_id:string;value:string|null}>("SELECT indicator_id,value::text FROM public.smn_indicator_manual_value WHERE team_id=$1 AND cycle_type=$2 AND cycle_id=$3 ORDER BY indicator_id",[teamId,cycleType,cycleId])
 ]);
 return {revision:Number(revision.rows[0]?.revision??0),values:values.rows};
}
