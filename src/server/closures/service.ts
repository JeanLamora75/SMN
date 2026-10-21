import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {isValidDate} from "../members/assignment";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const TEAM_ID=/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/u;
type Team={id:string;name:string};
type Row={id:string;team_id:string;name:string;start_on:string;end_on:string;
 is_active:boolean;revision:number;created_at:string;updated_at:string};
export type Closure={
 id:string;teamId:string;name:string;startOn:string;endOn:string;
 isActive:boolean;revision:number;createdAt:string;updatedAt:string;
};
type ClosureInput=
 |{action:"create";teamId:string;name:string;startOn:string;endOn:string}
 |{action:"update";id:string;revision:number;teamId:string;
   name:string;startOn:string;endOn:string;isActive:boolean};
export type ClosureError="invalid-input"|"invalid-date"|"name-required"|
 "team-not-found"|"not-found"|"conflict"|"overlap";
export type ClosureWrite=
 |{ok:true;created:boolean;closure:Closure}
 |{ok:false;error:ClosureError};
const project=(r:Row):Closure=>({id:r.id,teamId:r.team_id,name:r.name,
 startOn:r.start_on,endOn:r.end_on,isActive:r.is_active,revision:r.revision,
 createdAt:r.created_at,updatedAt:r.updated_at});
const parseDay=(x:unknown):x is string=>isValidDate(x)&&x>="1900-01-01"&&x<="2200-12-31";
export function parseClosure(raw:unknown):
 {ok:true;value:ClosureInput}|{ok:false;error:ClosureError}{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false,error:"invalid-input"};
 const v=raw as Record<string,unknown>;
 if(v.action!=="create"&&v.action!=="update")return {ok:false,error:"invalid-input"};
 const keys=v.action==="create"?["action","teamId","name","startOn","endOn"]:
  ["action","id","revision","teamId","name","startOn","endOn","isActive"];
 if(Object.keys(v).length!==keys.length||Object.keys(v).some(k=>!keys.includes(k))||
  typeof v.teamId!=="string"||!TEAM_ID.test(v.teamId))
  return {ok:false,error:"invalid-input"};
 if(typeof v.name!=="string"||!v.name.trim())return {ok:false,error:"name-required"};
 const name=v.name.trim().replace(/\s+/gu," ");
 if(name.length>120||/[\u0000-\u001f\u007f]/u.test(v.name))
  return {ok:false,error:"invalid-input"};
 if(!parseDay(v.startOn)||!parseDay(v.endOn)||v.startOn>v.endOn)
  return {ok:false,error:"invalid-date"};
 if(v.action==="create")return {ok:true,value:{action:"create",
  teamId:v.teamId,name,startOn:v.startOn,endOn:v.endOn}};
 if(typeof v.id!=="string"||!UUID.test(v.id)||
  typeof v.revision!=="number"||!Number.isSafeInteger(v.revision)||
  v.revision<1||typeof v.isActive!=="boolean")return {ok:false,error:"invalid-input"};
 return {ok:true,value:{action:"update",id:v.id,revision:v.revision,teamId:v.teamId,
  name,startOn:v.startOn,endOn:v.endOn,isActive:v.isActive}};
}
const rowSql=[
 "SELECT id,team_id,name,start_on::text AS start_on,end_on::text AS end_on,",
 "is_active,revision,created_at::text AS created_at,updated_at::text AS updated_at",
 "FROM public.smn_company_closure"
].join(" ");
const installationTeamSql=[
 "SELECT t.id,t.name FROM public.smn_team t",
 "JOIN public.smn_installation i ON i.id=t.installation_id",
 "WHERE i.id='singleton' AND i.state='initialized' AND i.mode IN ('scrum','kanban')",
 "LIMIT 2"
].join(" ");
export async function listCompanyClosures(db:Client):Promise<{
 team:Team;closures:Closure[];
}>{
 const teams=await db.query<Team>(installationTeamSql);
 if(teams.rows.length!==1)throw Error("company-closure-team-unavailable");
 const rows=await db.query<Row>(rowSql+" WHERE team_id=$1 ORDER BY start_on DESC,id LIMIT 501",
  [teams.rows[0].id]);
 if(rows.rows.length>500)throw Error("company-closure-list-limit");
 return {team:teams.rows[0],closures:rows.rows.map(project)};
}
const snapshot=(v:{name:string;startOn:string;endOn:string;isActive:boolean})=>({
 name:v.name,startOn:v.startOn,endOn:v.endOn,isActive:v.isActive
});
/** No member absence rows are ever inserted. Serialize edits by locking the single team. */
export async function saveCompanyClosure(db:Client,actorId:string,raw:unknown):
 Promise<ClosureWrite>{
 const parsed=parseClosure(raw);
 if(!parsed.ok||!actorId)return !parsed.ok?parsed:{ok:false,error:"invalid-input"};
 const input=parsed.value;
 await db.query("BEGIN");
 try{
  const fail=async(error:ClosureError):Promise<ClosureWrite>=>{
   await db.query("ROLLBACK");return {ok:false,error};
  };
  const teams=await db.query<Team>(installationTeamSql+" FOR UPDATE OF t");
  if(teams.rows.length!==1||teams.rows[0].id!==input.teamId)return fail("team-not-found");
  let previous:Closure|null=null;
  if(input.action==="update"){
   const existing=await db.query<Row>(rowSql+" WHERE id=$1 AND team_id=$2 FOR UPDATE",
    [input.id,input.teamId]);
   if(existing.rows.length!==1)return fail("not-found");
   previous=project(existing.rows[0]);
   if(previous.revision!==input.revision)return fail("conflict");
  }
  const isActive=input.action==="create"?true:input.isActive;
  if(isActive){
   const overlap=await db.query<{id:string}>([
    "SELECT id FROM public.smn_company_closure",
    "WHERE team_id=$1 AND is_active=true AND id<>$2",
    "AND start_on<=$3::date AND end_on>=$4::date LIMIT 1"
   ].join(" "),[input.teamId,previous?.id??"",input.endOn,input.startOn]);
   if(overlap.rows.length>0)return fail("overlap");
  }
  const id=previous?.id??randomUUID();
  if(previous){
   const changed=await db.query([
    "UPDATE public.smn_company_closure",
    "SET name=$3,start_on=$4::date,end_on=$5::date,is_active=$6,",
    "revision=revision+1,updated_by=$7,updated_at=now()",
    "WHERE id=$1 AND team_id=$2 AND revision=$8"
   ].join(" "),[id,input.teamId,input.name,input.startOn,input.endOn,isActive,
    actorId,previous.revision]);
   if(changed.rowCount!==1)return fail("conflict");
  }else{
   await db.query([
    "INSERT INTO public.smn_company_closure",
    "(id,team_id,name,start_on,end_on,is_active,revision,created_by,updated_by)",
    "VALUES($1,$2,$3,$4::date,$5::date,true,1,$6,$6)"
   ].join(" "),[id,input.teamId,input.name,input.startOn,input.endOn,actorId]);
  }
  const revision=(previous?.revision??0)+1;
  await db.query([
   "INSERT INTO public.smn_company_closure_history",
   "(id,closure_id,revision,operation,previous_values,next_values,changed_by)",
   "VALUES($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7)"
  ].join(" "),[randomUUID(),id,revision,previous?"update":"create",
   previous?JSON.stringify(snapshot(previous)):null,
   JSON.stringify(snapshot({name:input.name,startOn:input.startOn,
    endOn:input.endOn,isActive})),actorId]);
  const final=await db.query<Row>(rowSql+" WHERE id=$1 AND team_id=$2",[id,input.teamId]);
  if(final.rows.length!==1)throw Error("company-closure-missing-after-save");
  await db.query("COMMIT");
  return {ok:true,created:!previous,closure:project(final.rows[0])};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
