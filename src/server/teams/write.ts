import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {normalizedTeamName,parseTeamCreate,parseTeamUpdate,type TeamFormValues} from "@/lib/team-form";

export type TeamWriteError="invalid-input"|"forbidden"|"not-found"|"schema-not-ready"|"duplicate-name"|"conflict";
export type TeamWriteResult=
 | Readonly<{ok:false;error:TeamWriteError}>
 | Readonly<{ok:true;changed:boolean;teamId:string;revision:number;values:TeamFormValues}>;

type Installation={id:string;schema_version:number;state:string;mode:string};
type TeamRow={id:string;name:string;product_id:string|null;product_name:string|null};
type Stored={revision:number;vision:string|null;product_goal:string|null};
const failed=(error:TeamWriteError):TeamWriteResult=>({ok:false,error});

async function lockAuthorizedInstallation(db:Client,installationId:string,actorId:string):Promise<TeamWriteError|null>{
 const installation=await db.query<Installation>(
  "SELECT id,schema_version,state,mode FROM public.smn_installation WHERE id=$1 FOR UPDATE",
  [installationId]);
 const i=installation.rows[0];
 if(!i||i.state!=="initialized"||!["scrum","kanban"].includes(i.mode))return "not-found";
 const account=await db.query<{id:string}>(
  "SELECT id FROM public.smn_account WHERE id=$1 AND installation_id=$2 "+
  "AND role='admin' AND is_active=true AND must_change_password=false",
  [actorId,installationId]);
 if(account.rows.length!==1)return "forbidden";
 // Ne jamais activer une création multiéquipes avec la structure historique monoéquipe.
 if(![28,29,30].includes(i.schema_version))return "schema-not-ready";
 const required=await db.query<{ready:boolean}>(`SELECT
  to_regclass('public.smn_team_context') IS NOT NULL
  AND to_regclass('public.smn_team_context_audit') IS NOT NULL
  AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='smn_team' AND column_name='product_id' AND is_nullable='YES') AS ready`);
 if(required.rows[0]?.ready!==true)return "schema-not-ready";
 return null;
}
async function collides(db:Client,installationId:string,name:string,exceptId?:string){
 const result=await db.query<{id:string;name:string}>(
  "SELECT id,name FROM public.smn_team WHERE installation_id=$1",[installationId]);
 const wanted=normalizedTeamName(name);
 return result.rows.some(row=>row.id!==exceptId&&normalizedTeamName(row.name)===wanted);
}
async function recordChange(db:Client,teamId:string,revision:number,actorId:string,
 before:object,after:TeamFormValues){
 await db.query("INSERT INTO public.smn_team_context_audit "+
  "(id,team_id,revision,before_values,after_values,actor_id) "+
  "VALUES($1,$2,$3,$4::jsonb,$5::jsonb,$6)",
  [randomUUID(),teamId,revision,JSON.stringify(before),JSON.stringify(after),actorId]);
}
async function transaction<T>(db:Client,fn:()=>Promise<T>):Promise<T>{
 await db.query("BEGIN");
 try{const result=await fn();await db.query("COMMIT");return result;}
 catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}

/** Création atomique, non exposée par HTTP avant migration v28 et isolation des lecteurs. */
export async function createInstallationTeam(db:Client,installationId:string,
 actorId:string,raw:unknown):Promise<TeamWriteResult>{
 const input=parseTeamCreate(raw);
 if(!input)return failed("invalid-input");
 return transaction<TeamWriteResult>(db,async()=>{
  const guard=await lockAuthorizedInstallation(db,installationId,actorId);
  if(guard)return failed(guard);
  if(await collides(db,installationId,input.name))return failed("duplicate-name");
  const teamId=randomUUID();
  let productId:string|null=null;
  if(input.productName){
   productId=randomUUID();
   await db.query("INSERT INTO public.smn_product(id,installation_id,name) VALUES($1,$2,$3)",
    [productId,installationId,input.productName]);
  }
  await db.query("INSERT INTO public.smn_team(id,installation_id,product_id,name) VALUES($1,$2,$3,$4)",
   [teamId,installationId,productId,input.name]);
  await db.query("INSERT INTO public.smn_team_context "+
   "(team_id,vision,product_goal,revision,updated_by) VALUES($1,$2,$3,1,$4)",
   [teamId,input.vision,input.productGoal,actorId]);
  await recordChange(db,teamId,1,actorId,{},input);
  return {ok:true,changed:true,teamId,revision:1,values:input};
 });
}

/** L'équipe verrouillée évite les interversions de produit pendant une édition. */
export async function updateInstallationTeam(db:Client,installationId:string,
 actorId:string,raw:unknown):Promise<TeamWriteResult>{
 const input=parseTeamUpdate(raw);
 if(!input)return failed("invalid-input");
 return transaction<TeamWriteResult>(db,async()=>{
  const guard=await lockAuthorizedInstallation(db,installationId,actorId);
  if(guard)return failed(guard);
  const t=await db.query<TeamRow>("SELECT t.id,t.name,t.product_id,p.name AS product_name "+
   "FROM public.smn_team t LEFT JOIN public.smn_product p "+
   "ON p.id=t.product_id AND p.installation_id=t.installation_id "+
   "WHERE t.id=$1 AND t.installation_id=$2 FOR UPDATE OF t",
   [input.teamId,installationId]);
  const team=t.rows[0];
  if(!team)return failed("not-found");
  if(team.product_id!==null&&team.product_name===null)
   throw Error("team-product-outside-installation");
  const stored=await db.query<Stored>("SELECT revision,vision,product_goal "+
   "FROM public.smn_team_context WHERE team_id=$1 FOR UPDATE",[input.teamId]);
  const previous=stored.rows[0]??null,revision=previous?.revision??0;
  if(revision!==input.revision)return failed("conflict");
  if(await collides(db,installationId,input.name,input.teamId))return failed("duplicate-name");
  const before:TeamFormValues={
   name:team.name,productName:team.product_name??null,
   vision:previous?.vision??null,productGoal:previous?.product_goal??null
  };
  const after:TeamFormValues={
   name:input.name,productName:input.productName,
   vision:input.vision,productGoal:input.productGoal
  };
  if(Object.keys(after).every(key=>before[key as keyof TeamFormValues]===after[key as keyof TeamFormValues]))
   return {ok:true,changed:false,teamId:input.teamId,revision,values:before};
  let productId=team.product_id;
  if(!after.productName)productId=null; // Préserver l'ancien produit dans l'historique.
  else if(productId){
   const renamed=await db.query("UPDATE public.smn_product SET name=$3 WHERE id=$1 AND installation_id=$2",
    [productId,installationId,after.productName]);
   if(renamed.rowCount!==1)throw Error("team-product-update-inconsistent");
  }else{
   productId=randomUUID();
   await db.query("INSERT INTO public.smn_product(id,installation_id,name) VALUES($1,$2,$3)",
    [productId,installationId,after.productName]);
  }
  const saved=await db.query("UPDATE public.smn_team SET name=$3,product_id=$4 "+
   "WHERE id=$1 AND installation_id=$2",[input.teamId,installationId,after.name,productId]);
  if(saved.rowCount!==1)throw Error("team-update-inconsistent");
  if(previous){
   const changed=await db.query("UPDATE public.smn_team_context "+
    "SET vision=$3,product_goal=$4,revision=revision+1,updated_by=$5,updated_at=now() "+
    "WHERE team_id=$1 AND revision=$2",
    [input.teamId,revision,after.vision,after.productGoal,actorId]);
   if(changed.rowCount!==1)throw Error("team-context-conflicting-update");
  }else{
   await db.query("INSERT INTO public.smn_team_context "+
    "(team_id,vision,product_goal,revision,updated_by) VALUES($1,$2,$3,1,$4)",
    [input.teamId,after.vision,after.productGoal,actorId]);
  }
  const next=revision+1;
  await recordChange(db,input.teamId,next,actorId,before,after);
  return {ok:true,changed:true,teamId:input.teamId,revision:next,values:after};
 });
}
