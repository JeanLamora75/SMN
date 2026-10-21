import {randomUUID} from "node:crypto";
import type {Client} from "pg";

export type AgileRole="scrum_master"|"product_owner"|"developer";
export type QuickMember=Readonly<{
 id:string;memberNumber:number;displayName:string;email:null;revision:0;isProvisional:true;
 agileRole:AgileRole;startOn:string;
 contractPercent:100;allocationPercent:100;rolePercent:100;contributionPercent:100;
 developmentCapacityJh:null;
}>;
export type MemberListItem=Readonly<Omit<QuickMember,"email"|"revision"|"isProvisional"|"contractPercent"|"allocationPercent"|"rolePercent"|"contributionPercent"|"developmentCapacityJh"> & {
 email:string|null;revision:number;isProvisional:boolean;contractPercent:number;allocationPercent:number;rolePercent:number;
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
  WHERE i.id='singleton' AND i.state='initialized' AND i.mode IN ('scrum','kanban')
  LIMIT 2`);
 if(team.rows.length!==1||!["scrum","kanban"].includes(team.rows[0].mode))
  throw new Error("members-team-unavailable");
 return {id:team.rows[0].team_id,name:team.rows[0].team_name,mode:team.rows[0].mode};
}
type MemberRow={id:string;member_number:number;display_name:string;email:string|null;revision:number;is_provisional:boolean;
 agile_role:AgileRole;start_on:string;contract_percent:number;allocation_percent:number;
 role_percent:number;contribution_percent:number;
 v_contract:number|null;v_allocation:number|null;v_contribution:number|null;
 v_sm:number|null;v_po:number|null;v_dev:number|null};
const memberSelect=`SELECT m.id,m.member_number,m.display_name,m.email,m.revision,m.is_provisional,
 m.contract_percent,m.contribution_percent,a.agile_role,a.start_on::text AS start_on,
 a.allocation_percent,a.role_percent,
 v.contract_percent AS v_contract,v.allocation_percent AS v_allocation,
 v.contribution_percent AS v_contribution,v.scrum_master_percent AS v_sm,
 v.product_owner_percent AS v_po,v.developer_percent AS v_dev
 FROM public.smn_member m
 JOIN public.smn_member_assignment a ON a.member_id=m.id
 JOIN public.smn_team t ON t.id=a.team_id AND t.installation_id=m.installation_id
 LEFT JOIN LATERAL (
  SELECT contract_percent,allocation_percent,contribution_percent,
   scrum_master_percent,product_owner_percent,developer_percent
  FROM public.smn_member_assignment_version
  WHERE assignment_id=a.id AND effective_from<=CURRENT_DATE
  ORDER BY effective_from DESC,revision DESC LIMIT 1
 ) v ON true
 WHERE m.installation_id='singleton' AND t.installation_id='singleton'`;
function project(row:MemberRow):MemberListItem{
 if(!["scrum_master","product_owner","developer"].includes(row.agile_role)||
  !Number.isSafeInteger(row.member_number)||row.member_number<1||
  typeof row.display_name!=="string"||typeof row.start_on!=="string")
  throw new Error("member-record-invalid");
 const shares={scrumMaster:row.v_sm??(row.agile_role==="scrum_master"?100:0),
  productOwner:row.v_po??(row.agile_role==="product_owner"?100:0),
  developer:row.v_dev??(row.agile_role==="developer"?100:0)};
 const agileRole:AgileRole=shares.developer>=shares.scrumMaster&&shares.developer>=shares.productOwner?
  "developer":shares.scrumMaster>=shares.productOwner?"scrum_master":"product_owner";
 return {id:row.id,memberNumber:row.member_number,displayName:row.display_name,email:row.email??null,revision:row.revision??0,
  isProvisional:row.is_provisional,agileRole,startOn:row.start_on,
  contractPercent:row.v_contract??row.contract_percent,contributionPercent:row.v_contribution??row.contribution_percent,
  allocationPercent:row.v_allocation??row.allocation_percent,rolePercent:row.role_percent,
  roleShares:shares,developmentCapacityJh:null};
}
export async function listTeamMembers(client:Client):Promise<TeamMembers>{
 const team=await installedTeam(client);
 const members=await client.query<MemberRow>(memberSelect+
  " AND t.id=$1 ORDER BY m.member_number ASC LIMIT 51",[team.id]);
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
    " AND t.id=$1 AND m.batch_id=$2 ORDER BY m.member_number ASC",
    [team.id,input.requestId]);
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
  const dateResult=await client.query<{today:string}>("SELECT CURRENT_DATE::text AS today");
  const startOn=dateResult.rows[0]?.today;
  if(!startOn||!/^\\d{4}-\\d{2}-\\d{2}$/.test(startOn))throw new Error("members-date-unavailable");
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
   members.push({id,memberNumber,displayName,email:null,revision:0,isProvisional:true,agileRole:role,startOn,
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
