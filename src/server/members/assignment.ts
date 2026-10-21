import {randomUUID} from "node:crypto";
import type {Client} from "pg";

export type RoleShares=Readonly<{scrumMaster:number;productOwner:number;developer:number}>;
export type AssignmentInput=Readonly<{
 memberId:string;teamId:string;effectiveFrom:string;contractPercent:number;
 allocationPercent:number;contributionPercent:number;shares:RoleShares;revision:number;
}>;
export type AssignmentVersion=Readonly<{
 revision:number;effectiveFrom:string;contractPercent:number;allocationPercent:number;
 contributionPercent:number;shares:RoleShares;developerShare:number;
}>;
export type AssignmentState=Readonly<{
 memberId:string;teamId:string;assignmentId:string|null;startOn:string|null;today:string;
 latestRevision:number;versions:AssignmentVersion[];current:AssignmentVersion|null;
}>;
export type AssignmentWriteResult={ok:true;created:boolean;revision:number}|
 {ok:false;error:"invalid-input"|"team-unavailable"|"not-found"|"already-assigned"|
 "conflict"|"date-in-past"|"date-before-assignment"|"date-before-latest"|"archived"};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TEAM_ID=/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/;
const percent=(v:unknown):v is number=>Number.isSafeInteger(v)&&typeof v==="number"&&v>=0&&v<=100;
export function isValidDate(value:unknown):value is string{
 if(typeof value!=="string"||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value))return false;
 const time=Date.parse(value+"T00:00:00.000Z");
 return Number.isFinite(time)&&new Date(time).toISOString().slice(0,10)===value;
}
export function developerShareFraction(shares:RoleShares):number{return shares.developer/100;}
export function parseAssignmentInput(raw:unknown):AssignmentInput|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).length!==8||typeof v.memberId!=="string"||!UUID.test(v.memberId)||
  typeof v.teamId!=="string"||!TEAM_ID.test(v.teamId)||
  !isValidDate(v.effectiveFrom)||!percent(v.contractPercent)||!percent(v.allocationPercent)||
  !percent(v.contributionPercent)||!Number.isSafeInteger(v.revision)||typeof v.revision!=="number"||
  v.revision<0||!v.shares||typeof v.shares!=="object"||Array.isArray(v.shares))return null;
 const shares=v.shares as Record<string,unknown>;
 if(Object.keys(shares).length!==3||!percent(shares.scrumMaster)||
  !percent(shares.productOwner)||!percent(shares.developer)||
  shares.scrumMaster+shares.productOwner+shares.developer!==100||
  v.allocationPercent>v.contractPercent)return null;
 return {memberId:v.memberId,teamId:v.teamId,effectiveFrom:v.effectiveFrom,
  contractPercent:v.contractPercent,allocationPercent:v.allocationPercent,
  contributionPercent:v.contributionPercent,revision:v.revision,
  shares:{scrumMaster:shares.scrumMaster,productOwner:shares.productOwner,developer:shares.developer}};
}
type VersionRow={revision:number;effective_from:string;contract_percent:number;allocation_percent:number;
 contribution_percent:number;scrum_master_percent:number;product_owner_percent:number;developer_percent:number};
type AssignmentRow={id:string;team_id:string;start_on:string;end_on:string|null};
function versionOf(v:VersionRow):AssignmentVersion{
 const shares={scrumMaster:v.scrum_master_percent,productOwner:v.product_owner_percent,
  developer:v.developer_percent};
 return {revision:v.revision,effectiveFrom:v.effective_from,contractPercent:v.contract_percent,
  allocationPercent:v.allocation_percent,contributionPercent:v.contribution_percent,
  shares,developerShare:developerShareFraction(shares)};
}
const versionsSql=`SELECT revision,effective_from::text AS effective_from,contract_percent,
 allocation_percent,contribution_percent,scrum_master_percent,product_owner_percent,developer_percent
 FROM public.smn_member_assignment_version WHERE assignment_id=$1
 ORDER BY effective_from ASC,revision ASC LIMIT 501`;
async function teamAndMember(client:Client,id:string,lock:boolean){
 const member=await client.query<{id:string;contract_percent:number;archived_at:string|null}>(
  `SELECT id,contract_percent,archived_at::text AS archived_at FROM public.smn_member WHERE id=$1 AND installation_id='singleton'`+
   (lock?" FOR UPDATE":""),[id]);
 if(member.rows.length!==1)return null;
 const team=await client.query<{id:string}>(`SELECT t.id FROM public.smn_team t
 JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE i.id='singleton' AND i.state='initialized' AND i.mode IN ('scrum','kanban') LIMIT 2`);
 if(team.rows.length!==1)throw new Error("members-team-unavailable");
 return {teamId:team.rows[0].id,archived:member.rows[0].archived_at!=null};
}
async function assignmentFor(client:Client,id:string,lock:boolean){
 const rows=await client.query<AssignmentRow>(`SELECT id,team_id,start_on::text AS start_on,
 end_on::text AS end_on FROM public.smn_member_assignment WHERE member_id=$1
 ORDER BY start_on DESC,id DESC`+(lock?" FOR UPDATE":""),[id]);
 const open=rows.rows.filter(a=>a.end_on===null);
 if(open.length>1)throw new Error("members-duplicate-assignment");
 return {current:open[0]??null,all:rows.rows};
}
async function effectiveToday(client:Client):Promise<string>{
 const r=await client.query<{today:string}>("SELECT CURRENT_DATE::text AS today");
 const value=r.rows[0]?.today;
 if(!isValidDate(value))throw new Error("members-clock-unavailable");
 return value;
}
export async function readMemberAssignment(client:Client,memberId:string):Promise<AssignmentState>{
 if(!UUID.test(memberId))throw new Error("member-id-invalid");
 const member=await teamAndMember(client,memberId,false);
 if(!member)throw new Error("member-not-found");
 const today=await effectiveToday(client);
 const found=await assignmentFor(client,memberId,false);
 if(found.all.some(a=>a.team_id!==member.teamId))throw new Error("member-out-of-scope");
 const assignment=found.current;
 const rows=assignment?await client.query<VersionRow>(versionsSql,[assignment.id]):{rows:[]};
 if(rows.rows.length>500)throw new Error("members-versions-limit");
 const versions=rows.rows.map(versionOf);
 const current=versions.filter(v=>v.effectiveFrom<=today).at(-1)??null;
 return {memberId,teamId:member.teamId,assignmentId:assignment?.id??null,
  startOn:assignment?.start_on??null,today,latestRevision:Math.max(0,...versions.map(v=>v.revision)),
  current,versions};
}
/** The version log is append-only; equal-day corrections retain the earlier entry for audit. */
export async function saveMemberAssignment(client:Client,memberId:string,actorId:string,
 raw:unknown):Promise<AssignmentWriteResult>{
 const input=parseAssignmentInput(raw);
 if(!input||input.memberId!==memberId||!UUID.test(memberId)||!actorId)
  return {ok:false,error:"invalid-input"};
 await client.query("BEGIN");
 try{
  // Locks the central identity so first assignment, history and profile edits cannot race.
  const member=await teamAndMember(client,memberId,true);
  if(!member){await client.query("ROLLBACK");return {ok:false,error:"not-found"};}
  if(member.archived){await client.query("ROLLBACK");return {ok:false,error:"archived"};}
  if(member.teamId!==input.teamId){
   await client.query("ROLLBACK");return {ok:false,error:"team-unavailable"};
  }
  const today=await effectiveToday(client);
  if(input.effectiveFrom<today){
   await client.query("ROLLBACK");return {ok:false,error:"date-in-past"};
  }
  const found=await assignmentFor(client,memberId,true);
  if(found.all.some(a=>a.team_id!==member.teamId)){
   await client.query("ROLLBACK");return {ok:false,error:"team-unavailable"};
  }
  const current=found.current;
  const lastEnd=found.all.filter(a=>a.end_on!==null).map(a=>a.end_on!).sort().at(-1)??null;
  if(!current&&lastEnd!==null&&input.effectiveFrom<=lastEnd){
   await client.query("ROLLBACK");return {ok:false,error:"date-before-assignment"};
  }
  if(current&&input.effectiveFrom<current.start_on){
   await client.query("ROLLBACK");return {ok:false,error:"date-before-assignment"};
  }
  const history=current?await client.query<VersionRow>(versionsSql,[current.id]):{rows:[]};
  if(history.rows.length>500)throw new Error("members-versions-limit");
  const latest=history.rows.at(-1)??null;
  const latestRevision=latest?Math.max(...history.rows.map(v=>v.revision)):0;
  if(latestRevision!==input.revision){
   await client.query("ROLLBACK");return {ok:false,error:"conflict"};
  }
  if(latest&&input.effectiveFrom<latest.effective_from){
   await client.query("ROLLBACK");return {ok:false,error:"date-before-latest"};
  }
  const id=current?.id??randomUUID();
  if(!current){
   const primary=input.shares.developer>=input.shares.scrumMaster&&input.shares.developer>=input.shares.productOwner?
    "developer":input.shares.scrumMaster>=input.shares.productOwner?"scrum_master":"product_owner";
   await client.query(`INSERT INTO public.smn_member_assignment
    (id,member_id,team_id,start_on,agile_role,allocation_percent,role_percent)
    VALUES($1,$2,$3,$4::date,$5,$6,100)`,
    [id,memberId,member.teamId,input.effectiveFrom,primary,input.allocationPercent]);
  }
  const revision=latestRevision+1;
  await client.query(`INSERT INTO public.smn_member_assignment_version
   (id,assignment_id,revision,allocation_percent,contract_percent,contribution_percent,
    effective_from,scrum_master_percent,product_owner_percent,developer_percent,created_by)
   VALUES($1,$2,$3,$4,$5,$6,$7::date,$8,$9,$10,$11)`,
   [randomUUID(),id,revision,input.allocationPercent,input.contractPercent,
    input.contributionPercent,input.effectiveFrom,input.shares.scrumMaster,
    input.shares.productOwner,input.shares.developer,actorId]);
  await client.query("COMMIT");
  return {ok:true,created:current===null,revision};
 }catch(error){
  await client.query("ROLLBACK").catch(()=>undefined);
  throw error;
 }
}
