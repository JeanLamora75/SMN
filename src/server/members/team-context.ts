import {randomUUID} from "node:crypto";
import type {Client} from "pg";

const TEAM_ID=/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/u;
const NAME_MAX=120,CONTENT_MAX=5000;
export type TeamContext=Readonly<{teamId:string;name:string;productName:string;vision:string|null;
 productGoal:string|null;revision:number;agileMode:"scrum"|"kanban"|null}>;
export type TeamContextVersion=Readonly<{revision:number;name:string;productName:string|null;
 vision:string|null;productGoal:string|null;changedAt:string}>;
type Scope={id:string;name:string;product_id:string;product_name:string};
type CurrentRow={vision:string|null;product_goal:string|null;revision:number};
type HistoryRow={revision:number;after_values:unknown;changed_at:string;actor_id:string|null};
const scopeSql="SELECT t.id,t.name,p.id AS product_id,p.name AS product_name FROM public.smn_team t "+
 "JOIN public.smn_product p ON p.id=t.product_id AND p.installation_id=t.installation_id "+
 "JOIN public.smn_installation i ON i.id=t.installation_id "+
 "WHERE t.id=$1 AND i.id='singleton' AND i.state='initialized' "+
 "AND lower(i.mode) IN ('scrum','kanban')";
const record=(raw:unknown):Record<string,unknown>|null=>
 raw!==null&&typeof raw==="object"&&!Array.isArray(raw)?
 raw as Record<string,unknown>:null;
const cleanName=(raw:unknown):string|null=>{
 if(typeof raw!=="string"||/[\u0000-\u001f\u007f]/u.test(raw))return null;
 const name=raw.trim().replace(/\s+/gu," ");
 return name.length>0&&name.length<=NAME_MAX?name:null;
};
const cleanContent=(raw:unknown):string|null|undefined=>{
 if(raw===null)return null;
 if(typeof raw!=="string"||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(raw))
  return undefined;
 const value=raw.replace(/\r\n?/gu,"\n").trim();
 return value.length>CONTENT_MAX?undefined:value||null;
};
export function parseTeamContextChange(raw:unknown):{
 teamId:string;revision:number;name:string;productName:string;vision:string|null;productGoal:string|null
}|null{
 const v=record(raw);
 if(!v||Object.keys(v).sort().join(",")!=="name,productGoal,productName,revision,teamId,vision"||
  typeof v.teamId!=="string"||!TEAM_ID.test(v.teamId)||
  !Number.isSafeInteger(v.revision)||typeof v.revision!=="number"||v.revision<0)return null;
 const name=cleanName(v.name),productName=cleanName(v.productName),vision=cleanContent(v.vision);
 const productGoal=cleanContent(v.productGoal);
 if(name===null||productName===null||vision===undefined||productGoal===undefined)return null;
 return {teamId:v.teamId,revision:v.revision,name,productName,vision,productGoal};
}
export async function ensureTeamContextSchema(db:Client){
 await db.query("CREATE TABLE IF NOT EXISTS public.smn_team_context ("+
  "team_id text PRIMARY KEY REFERENCES public.smn_team(id) ON DELETE RESTRICT,"+
  "vision text,product_goal text,dod text,dor text,language text,"+
  "revision integer NOT NULL DEFAULT 1 CHECK(revision>0),"+
  "updated_at timestamptz NOT NULL DEFAULT now(),"+
  "updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL)");
 // Backward-compatible if a former producer created this table with fewer fields.
 await db.query("ALTER TABLE public.smn_team_context "+
  "ADD COLUMN IF NOT EXISTS vision text,ADD COLUMN IF NOT EXISTS product_goal text,"+
  "ADD COLUMN IF NOT EXISTS dod text,ADD COLUMN IF NOT EXISTS dor text,"+
  "ADD COLUMN IF NOT EXISTS language text,"+
  "ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 1,"+
  "ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),"+
  "ADD COLUMN IF NOT EXISTS updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL");
 await db.query("CREATE TABLE IF NOT EXISTS public.smn_team_context_audit ("+
  "id text PRIMARY KEY,team_id text NOT NULL REFERENCES public.smn_team(id) ON DELETE RESTRICT,"+
  "revision integer NOT NULL, before_values jsonb NOT NULL,after_values jsonb NOT NULL,"+
  "actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,"+
  "changed_at timestamptz NOT NULL DEFAULT now(),UNIQUE(team_id,revision))");
}
export async function readTeamContext(db:Client,teamId:string):Promise<{
 context:TeamContext;history:TeamContextVersion[]
}|null>{
 if(!TEAM_ID.test(teamId))return null;
 const scope=await db.query<Scope>(scopeSql,[teamId]);
 if(scope.rows.length!==1)return null;
 const schema=await db.query<{schema_version:number}>(
  "SELECT schema_version FROM public.smn_installation WHERE id='singleton'");
 const mode=schema.rows[0]?.schema_version===29
  ?await db.query<{agile_mode:"scrum"|"kanban"}>(
    "SELECT agile_mode FROM public.smn_team WHERE id=$1 AND installation_id='singleton'",[teamId])
  :null;
 const agileMode=mode?.rows[0]?.agile_mode??null;
 const installed=await db.query<{present:boolean}>(
  "SELECT to_regclass('public.smn_team_context') IS NOT NULL AS present");
 let current:CurrentRow|null=null,history:TeamContextVersion[]=[];
 if(installed.rows[0]?.present){
  const stored=await db.query<CurrentRow>(
   "SELECT vision,product_goal,revision FROM public.smn_team_context WHERE team_id=$1",
   [teamId]);
  current=stored.rows[0]??null;
  const audit=await db.query<{present:boolean}>(
   "SELECT to_regclass('public.smn_team_context_audit') IS NOT NULL AS present");
  if(audit.rows[0]?.present){
   const rows=await db.query<HistoryRow>(
    "SELECT revision,after_values,changed_at::text,actor_id "+
    "FROM public.smn_team_context_audit WHERE team_id=$1 "+
    "ORDER BY revision DESC LIMIT 50",[teamId]);
   history=rows.rows.flatMap(row=>{
    const value=record(row.after_values);
    if(!value||typeof value.name!=="string"||
       !Number.isSafeInteger(row.revision))return [];
    return [{revision:row.revision,name:value.name,
     productName:typeof value.productName==="string"?value.productName:null,
     vision:typeof value.vision==="string"?value.vision:null,
     productGoal:typeof value.productGoal==="string"?value.productGoal:null,
     changedAt:row.changed_at}];
   });
  }
 }
 const revision=current?.revision??0;
 if(!Number.isSafeInteger(revision)||revision<0)throw Error("team-context-revision-invalid");
 if(typeof scope.rows[0].product_name!=="string"||!scope.rows[0].product_name.trim())
  throw Error("team-context-product-invalid");
 return {context:{teamId,name:scope.rows[0].name,productName:scope.rows[0].product_name,
  vision:current?.vision??null,
  productGoal:current?.product_goal??null,revision,agileMode},history};
}
/** One transaction changes team identity and context with a shared revision and append-only audit. */
export async function saveTeamContext(db:Client,actorId:string,raw:unknown){
 const input=parseTeamContextChange(raw);
 if(!actorId||!input)return {ok:false as const,error:"invalid-input" as const};
 await db.query("BEGIN");
 try{
  const scope=await db.query<Scope>(scopeSql+" FOR UPDATE OF t,p",[input.teamId]);
  if(scope.rows.length!==1){
   await db.query("ROLLBACK");
   return {ok:false as const,error:"not-found" as const};
  }
  if(typeof scope.rows[0].product_name!=="string"||
     typeof scope.rows[0].product_id!=="string")throw Error("team-context-product-invalid");
  await ensureTeamContextSchema(db);
  const old=await db.query<CurrentRow>(
   "SELECT vision,product_goal,revision FROM public.smn_team_context "+
   "WHERE team_id=$1 FOR UPDATE",[input.teamId]);
  const prior=old.rows[0]??null,revision=prior?.revision??0;
  if(revision!==input.revision){
   await db.query("ROLLBACK");return {ok:false as const,error:"conflict" as const};
  }
  const before={name:scope.rows[0].name,productName:scope.rows[0].product_name,
   vision:prior?.vision??null,productGoal:prior?.product_goal??null};
  const after={name:input.name,productName:input.productName,
   vision:input.vision,productGoal:input.productGoal};
  if(before.name===after.name&&before.productName===after.productName&&
     before.vision===after.vision&&
     before.productGoal===after.productGoal){
   await db.query("COMMIT");
   return {ok:true as const,changed:false,context:{teamId:input.teamId,...after,revision}};
  }
  if(before.name!==after.name){
   const updated=await db.query("UPDATE public.smn_team SET name=$2 "+
    "WHERE id=$1 AND installation_id='singleton'",[input.teamId,input.name]);
   if(updated.rowCount!==1)throw Error("team-context-team-update-inconsistent");
  }
  // Rename the product label only; its ID and the installation binding remain immutable.
  if(before.productName!==after.productName){
   const changed=await db.query("UPDATE public.smn_product SET name=$2 "+
    "WHERE id=$1 AND installation_id='singleton'",
    [scope.rows[0].product_id,input.productName]);
   if(changed.rowCount!==1)throw Error("team-context-product-update-inconsistent");
  }
  if(prior){
   const u=await db.query("UPDATE public.smn_team_context SET "+
    "vision=$2,product_goal=$3,revision=revision+1,updated_by=$4,updated_at=now() "+
    "WHERE team_id=$1 AND revision=$5",
    [input.teamId,input.vision,input.productGoal,actorId,revision]);
   if(u.rowCount!==1)throw Error("team-context-conflicting-update");
  }else{
   await db.query("INSERT INTO public.smn_team_context "+
    "(team_id,vision,product_goal,revision,updated_by) VALUES($1,$2,$3,1,$4)",
    [input.teamId,input.vision,input.productGoal,actorId]);
  }
  const next=revision+1;
  await db.query("INSERT INTO public.smn_team_context_audit "+
   "(id,team_id,revision,before_values,after_values,actor_id) "+
   "VALUES($1,$2,$3,$4::jsonb,$5::jsonb,$6)",
   [randomUUID(),input.teamId,next,JSON.stringify(before),JSON.stringify(after),actorId]);
  await db.query("COMMIT");
  return {ok:true as const,changed:true,
   context:{teamId:input.teamId,...after,revision:next}};
 }catch(error){
  await db.query("ROLLBACK").catch(()=>undefined);
  throw error;
 }
}
