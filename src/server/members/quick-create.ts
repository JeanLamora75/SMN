import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {isValidCountry} from "./location";

export type AgileRole="scrum_master"|"product_owner"|"developer";
export type QuickMember=Readonly<{
 id:string;memberNumber:number;displayName:string;email:null;revision:0;isProvisional:true;
 agileRole:AgileRole;startOn:string;
 contractPercent:100;allocationPercent:100;rolePercent:100;contributionPercent:100;
 developmentCapacityJh:null;
}>;
export type MemberListItem=Readonly<Omit<QuickMember,"email"|"revision"|"isProvisional"|"agileRole"|"startOn"|"contractPercent"|"allocationPercent"|"rolePercent"|"contributionPercent"|"developmentCapacityJh"> & {
 email:string|null;professionalFunction:string|null;countryIso2:string|null;revision:number;isProvisional:boolean;agileRole:AgileRole|null;startOn:string|null;
 endOn:string|null;archived:boolean;archivedAt:string|null;isAssigned:boolean;contractPercent:number;allocationPercent:number;rolePercent:number;
 contributionPercent:number;roleShares:Readonly<{scrumMaster:number;productOwner:number;developer:number}>;developmentCapacityJh:null;
}>;
export type TeamMembers=Readonly<{
 team:Readonly<{id:string;name:string;mode:"scrum"|"kanban"}>;
 members:MemberListItem[];
}>;
type Request={teamId:string;count:number;requestId:string};
export type QuickCreateResult=
 {ok:true;created:boolean;members:MemberListItem[]}|
 {ok:false;error:"invalid-input"|"team-unavailable"|"already-initialized"|"request-conflict"};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TEAM_ID=/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/;
export function parseQuickMembersRequest(raw:unknown):Request|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).length!==3||
  !Number.isSafeInteger(v.count)||typeof v.count!=="number"||v.count<3||v.count>50||
  typeof v.teamId!=="string"||!TEAM_ID.test(v.teamId)||
  typeof v.requestId!=="string"||!UUID.test(v.requestId))return null;
 return {teamId:v.teamId,count:v.count,requestId:v.requestId};
}
export function initialAgileRole(index:number):AgileRole{
 if(!Number.isSafeInteger(index)||index<0)throw new Error("member-position-invalid");
 return index===0?"scrum_master":index===1?"product_owner":"developer";
}
type TeamRow={team_id:string;team_name:string;mode:"scrum"|"kanban"};
async function installedTeam(client:Client):Promise<TeamMembers["team"]>{
 const team=await client.query<TeamRow>(`SELECT t.id AS team_id,t.name AS team_name,i.mode
  FROM public.smn_team t JOIN public.smn_installation i ON i.id=t.installation_id
  WHERE i.id='singleton' AND i.state='initialized' AND i.schema_version<=27
   AND i.mode IN ('scrum','kanban')
  LIMIT 2`);
 if(team.rows.length!==1||!["scrum","kanban"].includes(team.rows[0].mode))
  throw new Error("members-team-unavailable");
 return {id:team.rows[0].team_id,name:team.rows[0].team_name,mode:team.rows[0].mode};
}
type MemberRow={id:string;member_number:number;display_name:string;email:string|null;professional_function:string|null;revision:number;
 is_provisional:boolean;archived_at:string|null;agile_role:AgileRole|null;start_on:string|null;
 end_on:string|null;contract_percent:number;contribution_percent:number;
 allocation_percent:number|null;role_percent:number|null;
 v_contract:number|null;v_allocation:number|null;v_contribution:number|null;
 v_sm:number|null;v_po:number|null;v_dev:number|null;country_iso2:string|null};
const memberSelect=`SELECT m.id,m.member_number,m.display_name,m.email,m.professional_function,m.revision,m.is_provisional,
 m.archived_at::text AS archived_at,m.contract_percent,m.contribution_percent,
 a.agile_role,a.start_on::text AS start_on,a.end_on::text AS end_on,
 a.allocation_percent,a.role_percent,loc.country_iso2,v.contract_percent AS v_contract,
 v.allocation_percent AS v_allocation,v.contribution_percent AS v_contribution,
 v.scrum_master_percent AS v_sm,v.product_owner_percent AS v_po,v.developer_percent AS v_dev
 FROM public.smn_member m
 LEFT JOIN LATERAL (
  SELECT a.id,a.team_id,a.start_on,a.end_on,a.agile_role,a.allocation_percent,a.role_percent
  FROM public.smn_member_assignment a
  JOIN public.smn_team t ON t.id=a.team_id AND t.installation_id=m.installation_id
  WHERE a.member_id=m.id
  ORDER BY (a.end_on IS NULL) DESC,a.start_on DESC,a.id DESC LIMIT 1
 ) a ON true
 LEFT JOIN LATERAL (
  SELECT contract_percent,allocation_percent,contribution_percent,
   scrum_master_percent,product_owner_percent,developer_percent
  FROM public.smn_member_assignment_version
  WHERE assignment_id=a.id AND effective_from<=CURRENT_DATE
  ORDER BY effective_from DESC,revision DESC LIMIT 1
 ) v ON true
 LEFT JOIN LATERAL (
  SELECT ml.country_iso2 FROM public.smn_member_location ml
  WHERE ml.member_id=m.id AND ml.effective_from<=CURRENT_DATE
  ORDER BY ml.effective_from DESC,ml.revision DESC LIMIT 1
 ) loc ON true WHERE m.installation_id='singleton'`;
function project(row:MemberRow):MemberListItem{
 if(!Number.isSafeInteger(row.member_number)||row.member_number<1||
    typeof row.display_name!=="string"||
    (row.agile_role!==null&&!["scrum_master","product_owner","developer"].includes(row.agile_role)))
   throw new Error("member-record-invalid");
 const shares={scrumMaster:row.v_sm??(row.agile_role==="scrum_master"?100:0),
  productOwner:row.v_po??(row.agile_role==="product_owner"?100:0),
  developer:row.v_dev??(row.agile_role==="developer"?100:0)};
 const primary:AgileRole|null=row.agile_role===null?null:
  shares.developer>=shares.scrumMaster&&shares.developer>=shares.productOwner?
   "developer":shares.scrumMaster>=shares.productOwner?"scrum_master":"product_owner";
 return {id:row.id,memberNumber:row.member_number,displayName:row.display_name,
  email:row.email??null,countryIso2:row.country_iso2??null,professionalFunction:row.professional_function??null,revision:row.revision??0,isProvisional:row.is_provisional,
  agileRole:primary,startOn:row.start_on,endOn:row.end_on,
  archived:row.archived_at!=null,archivedAt:row.archived_at??null,
  isAssigned:row.start_on!==null&&row.end_on===null,
  contractPercent:row.v_contract??row.contract_percent,
  contributionPercent:row.v_contribution??row.contribution_percent,
  allocationPercent:row.v_allocation??row.allocation_percent??0,rolePercent:row.role_percent??0,
  roleShares:shares,developmentCapacityJh:null};
}
export async function listTeamMembers(client:Client,
 authorizedTeam?:TeamMembers["team"]):Promise<TeamMembers>{
 const team=authorizedTeam??await installedTeam(client);
 // En v28 seuls les membres avec une affectation à l'équipe cible
 // sont visibles. Le LEFT JOIN latéral doit sélectionner cette même équipe.
 const memberSql=authorizedTeam?
  memberSelect.replace("WHERE a.member_id=m.id",
   "WHERE a.member_id=m.id AND a.team_id=$1")+
  " AND EXISTS(SELECT 1 FROM public.smn_member_assignment x "+
  "WHERE x.member_id=m.id AND x.team_id=$1) "+
  "ORDER BY m.member_number ASC LIMIT 51":
  memberSelect+
  " AND EXISTS(SELECT 1 FROM public.smn_team t WHERE t.id=$1 AND t.installation_id=m.installation_id) ORDER BY m.member_number ASC LIMIT 51";
 const members=await client.query<MemberRow>(memberSql,[team.id]);
 if(members.rows.length>50)throw new Error("members-list-limit");
 return {team,members:members.rows.map(project)};
}

/** Creates the first roster as one transaction; replaying the request ID cannot duplicate people. */
export async function createQuickMembers(client:Client,actorId:string,raw:unknown):Promise<QuickCreateResult>{
 const input=parseQuickMembersRequest(raw);
 if(!actorId||!input)return {ok:false,error:"invalid-input"};
 await client.query("BEGIN");
 try{
  await client.query("SELECT pg_advisory_xact_lock(20261021,42)");
  const team=await installedTeam(client);
  if(team.id!==input.teamId){
   await client.query("ROLLBACK");return {ok:false,error:"team-unavailable"};
  }
  const existing=await client.query<{id:string;team_id:string;requested_count:number;created_by:string|null}>(
   "SELECT id,team_id,requested_count,created_by FROM public.smn_member_batch WHERE id=$1 AND installation_id='singleton'",
   [input.requestId]);
  if(existing.rows.length){
   const batch=existing.rows[0];
   if(batch.team_id!==team.id||batch.requested_count!==input.count||batch.created_by!==actorId){
    await client.query("ROLLBACK");return {ok:false,error:"request-conflict"};
   }
   const original=await client.query<MemberRow>(memberSelect+
    " AND EXISTS(SELECT 1 FROM public.smn_team t WHERE t.id=$1 AND t.installation_id=m.installation_id) AND m.batch_id=$2 AND m.member_number<=$3 ORDER BY m.member_number ASC",
    [team.id,input.requestId,input.count]);
   if(original.rows.length!==input.count)throw new Error("members-batch-incomplete");
   await client.query("COMMIT");
   return {ok:true,created:false,members:original.rows.map(project)};
  }
  const present=await client.query<{count:number}>(
   "SELECT count(*)::int AS count FROM public.smn_member WHERE installation_id='singleton'");
  if(present.rows[0]?.count!==0){
   await client.query("ROLLBACK");return {ok:false,error:"already-initialized"};
  }
  await client.query(`INSERT INTO public.smn_member_batch
   (id,installation_id,team_id,requested_count,created_by)
   VALUES($1,'singleton',$2,$3,$4)`,
   [input.requestId,team.id,input.count,actorId]);
  const members:MemberListItem[]=[];
  const defaults=await client.query<{reference_country:string|null}>(
   "SELECT reference_country FROM public.smn_general_settings WHERE installation_id='singleton'");
  const defaultCountry=defaults.rows[0]?.reference_country??null;
  const dateResult=await client.query<{today:string}>("SELECT CURRENT_DATE::text AS today");
  const startOn=dateResult.rows[0]?.today;
  if(!startOn||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(startOn))throw new Error("members-date-unavailable");
  for(let index=0;index<input.count;index++){
   const id=randomUUID(),memberNumber=index+1,role=initialAgileRole(index);
   const displayName="Membre "+memberNumber;
   await client.query(`INSERT INTO public.smn_member
    (id,installation_id,batch_id,member_number,display_name,is_provisional,
     contract_percent,contribution_percent)
    VALUES ($1,'singleton',$2,$3,$4,true,100,100)`,
    [id,input.requestId,memberNumber,displayName]);
   const assignmentId=randomUUID();
   await client.query(`INSERT INTO public.smn_member_assignment
    (id,member_id,team_id,start_on,agile_role,allocation_percent,role_percent)
    VALUES ($1,$2,$3,$4::date,$5,100,100)`,
    [assignmentId,id,team.id,startOn,role]);
   await client.query(`INSERT INTO public.smn_member_assignment_version
    (id,assignment_id,revision,effective_from,allocation_percent,contract_percent,
     contribution_percent,scrum_master_percent,product_owner_percent,developer_percent)
    VALUES ($1,$2,1,$3::date,100,100,100,$4,$5,$6)`,
    [randomUUID(),assignmentId,startOn,role==="scrum_master"?100:0,
     role==="product_owner"?100:0,role==="developer"?100:0]);
   if(isValidCountry(defaultCountry)){
    await client.query(`INSERT INTO public.smn_member_location
     (id,member_id,revision,effective_from,country_iso2,region,city,time_zone,source,created_by)
     VALUES($1,$2,1,$3::date,$4,NULL,NULL,NULL,'installation-default',$5)`,
     [randomUUID(),id,startOn,defaultCountry,actorId]);
   }
   members.push({id,memberNumber,displayName,email:null,professionalFunction:null,countryIso2:null,revision:0,isProvisional:true,agileRole:role,startOn,endOn:null,archived:false,archivedAt:null,isAssigned:true,
    contractPercent:100,allocationPercent:100,rolePercent:100,contributionPercent:100,
    roleShares:{scrumMaster:role==="scrum_master"?100:0,productOwner:role==="product_owner"?100:0,developer:role==="developer"?100:0},
    developmentCapacityJh:null});
  }
  await client.query("COMMIT");
  return {ok:true,created:true,members};
 }catch(error){
  await client.query("ROLLBACK").catch(()=>undefined);
  throw error;
 }
}


/**
 * Create a single member after the initial team setup, without creating
 * an additional artificial 3-person batch. The original batch serves as
 * the required legacy FK container; requested_count remains the size of
 * the initial roster. Member IDs double as retry/idempotency request IDs.
 * A future schema migration should distinguish initial and individual origins.
 */
export async function createIndividualMember(client:Client,actorId:string,raw:unknown):Promise<
 {ok:true;created:boolean;member:MemberListItem}|
 {ok:false;error:"invalid-input"|"team-unavailable"|"not-initialized"|"roster-full"|"request-conflict"}
>{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false,error:"invalid-input"};
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).sort().join(",")!=="displayName,requestId,teamId"||
  typeof v.teamId!=="string"||!TEAM_ID.test(v.teamId)||
  typeof v.requestId!=="string"||!UUID.test(v.requestId)||
  typeof v.displayName!=="string")return {ok:false,error:"invalid-input"};
 const name=v.displayName.trim().replace(/\s+/gu," ");
 if(!name||name.length>120||/[\u0000-\u001f\u007f]/u.test(v.displayName))
  return {ok:false,error:"invalid-input"};
 await client.query("BEGIN");
 try{
  await client.query("SELECT pg_advisory_xact_lock(20261021,42)");
  const team=await installedTeam(client);
  if(team.id!==v.teamId){await client.query("ROLLBACK");return {ok:false,error:"team-unavailable"};}
  const prev=await client.query<MemberRow>(memberSelect+" AND m.id=$1",[v.requestId]);
  if(prev.rows.length){
   const item=project(prev.rows[0]);
   if(item.displayName!==name||!item.isAssigned){
    await client.query("ROLLBACK");return {ok:false,error:"request-conflict"};
   }
   await client.query("COMMIT");return {ok:true,created:false,member:item};
  }
  const batch=await client.query<{id:string}>(`SELECT id FROM public.smn_member_batch
   WHERE team_id=$1 AND installation_id='singleton' ORDER BY created_at,id LIMIT 1`,[team.id]);
  if(batch.rows.length===0){
   await client.query("ROLLBACK");return {ok:false,error:"not-initialized"};
  }
  const stats=await client.query<{next_number:number;total:number}>(`SELECT
   COALESCE(MAX(member_number),0)::int+1 AS next_number,count(*)::int AS total
   FROM public.smn_member WHERE installation_id='singleton'`);
  const next=stats.rows[0]?.next_number??0;
  if(next<1||next>50||stats.rows[0]?.total>=50){
   await client.query("ROLLBACK");return {ok:false,error:"roster-full"};
  }
  const today=(await client.query<{today:string}>("SELECT CURRENT_DATE::text AS today")).rows[0]?.today;
  if(!today)throw Error("member-date-unavailable");
  await client.query(`INSERT INTO public.smn_member
   (id,installation_id,batch_id,member_number,display_name,is_provisional,contract_percent,contribution_percent)
   VALUES($1,'singleton',$2,$3,$4,false,100,100)`,[v.requestId,batch.rows[0].id,next,name]);
  const assignmentId=randomUUID();
  await client.query(`INSERT INTO public.smn_member_assignment
   (id,member_id,team_id,start_on,agile_role,allocation_percent,role_percent)
   VALUES($1,$2,$3,$4::date,'developer',100,100)`,[assignmentId,v.requestId,team.id,today]);
  await client.query(`INSERT INTO public.smn_member_assignment_version
   (id,assignment_id,revision,effective_from,allocation_percent,contract_percent,
    contribution_percent,scrum_master_percent,product_owner_percent,developer_percent)
   VALUES($1,$2,1,$3::date,100,100,100,0,0,100)`,[randomUUID(),assignmentId,today]);
  const saved=await client.query<MemberRow>(memberSelect+" AND m.id=$1",[v.requestId]);
  if(saved.rows.length!==1)throw Error("individual-member-insert-failed");
  await client.query("COMMIT");
  return {ok:true,created:true,member:project(saved.rows[0])};
 }catch(error){await client.query("ROLLBACK").catch(()=>undefined);throw error;}
}
