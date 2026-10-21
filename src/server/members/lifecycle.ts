import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {isValidDate} from "./assignment";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export type LifecycleAction=
 |{action:"close";assignmentId:string;endOn:string;revision:number}
 |{action:"archive"|"reactivate";revision:number}
 |{action:"delete";revision:number;confirmation:"SUPPRIMER"};
export type LifecycleError="invalid-input"|"not-found"|"team-unavailable"|"conflict"|
 "assignment-not-found"|"assignment-already-closed"|"invalid-date"|"future-version"|
 "assignment-still-open"|"already-archived"|"not-archived"|"historical-references"|
 "business-data"|"cascade-risk";
export type LifecycleResult=
 |{ok:true;action:LifecycleAction["action"];revision:number;activeCount:number;warning:"team-below-three"|null}
 |{ok:false;error:LifecycleError};
export type LifecycleAssignment={id:string;teamId:string;startOn:string;endOn:string|null};
export type LifecycleImpact={memberId:string;teamId:string;displayName:string;revision:number;
 archived:boolean;archivedAt:string|null;today:string;activeCount:number;
 assignments:LifecycleAssignment[];referenceCount:number;canDelete:boolean};

type MemberRow={id:string;revision:number;is_provisional:boolean;display_name:string;email:string|null;
 archived_at:string|null;contract_percent:number;contribution_percent:number};
type AssignmentRow={id:string;team_id:string;start_on:string;end_on:string|null};

const revisionOk=(v:unknown):v is number=>typeof v==="number"&&Number.isSafeInteger(v)&&v>=0;
export function parseLifecycleAction(raw:unknown):LifecycleAction|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const v=raw as Record<string,unknown>;
 if(!revisionOk(v.revision)||typeof v.action!=="string")return null;
 if(v.action==="close"){
  if(Object.keys(v).length!==4||typeof v.assignmentId!=="string"||!UUID.test(v.assignmentId)||
   !isValidDate(v.endOn))return null;
  return {action:"close",assignmentId:v.assignmentId,endOn:v.endOn,revision:v.revision};
 }
 if(v.action==="archive"||v.action==="reactivate"){
  if(Object.keys(v).length!==2)return null;
  return {action:v.action,revision:v.revision};
 }
 if(v.action==="delete"&&Object.keys(v).length===3&&v.confirmation==="SUPPRIMER")
  return {action:"delete",revision:v.revision,confirmation:"SUPPRIMER"};
 return null;
}
async function load(client:Client,id:string,lock:boolean){
 const m=await client.query<MemberRow>(`SELECT m.id,m.revision,m.is_provisional,m.display_name,m.email,m.archived_at::text AS archived_at,
 m.contract_percent,m.contribution_percent FROM public.smn_member m
 WHERE m.id=$1 AND m.installation_id='singleton'`+(lock?" FOR UPDATE":""),
 [id]);
 if(m.rows.length!==1)return null;
 const t=await client.query<{id:string}>(`SELECT t.id FROM public.smn_team t
 JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE i.id='singleton' AND i.state='initialized' AND i.mode IN ('scrum','kanban') LIMIT 2`);
 if(t.rows.length!==1)throw new Error("lifecycle-team-unavailable");
 return {member:m.rows[0],teamId:t.rows[0].id};
}
async function today(client:Client){
 const r=await client.query<{today:string}>("SELECT CURRENT_DATE::text AS today");
 if(!isValidDate(r.rows[0]?.today))throw new Error("lifecycle-date-unavailable");
 return r.rows[0].today;
}
async function assignments(client:Client,id:string,lock:boolean){
 const r=await client.query<AssignmentRow>(`SELECT id,team_id,start_on::text AS start_on,
 end_on::text AS end_on FROM public.smn_member_assignment WHERE member_id=$1
 ORDER BY start_on ASC,id ASC`+(lock?" FOR UPDATE":""),[id]);
 return r.rows;
}
async function activeCount(client:Client,teamId:string){
 const r=await client.query<{active_count:number}>(`SELECT count(DISTINCT member_id)::int AS active_count
 FROM public.smn_member_assignment a JOIN public.smn_member m ON m.id=a.member_id
 WHERE a.team_id=$1 AND a.start_on<=CURRENT_DATE AND a.end_on IS NULL AND m.archived_at IS NULL`,[teamId]);
 return r.rows[0]?.active_count??0;
}
async function references(client:Client,id:string){
 const aa=await client.query<{refs:number}>(`SELECT count(*)::int AS refs FROM public.smn_member_assignment WHERE member_id=$1`,[id]);
 const ee=await client.query<{refs:number}>(`SELECT count(*)::int AS refs FROM public.smn_member_lifecycle_event WHERE member_id=$1`,[id]);
 return (aa.rows[0]?.refs??0)+(ee.rows[0]?.refs??0);
}
function isEmpty(member:MemberRow){
 return member.is_provisional&&member.email===null&&member.contract_percent===100&&
 member.contribution_percent===100&&member.revision===0&&/^Membre [1-9][0-9]*$/.test(member.display_name)&&
 member.archived_at===null;
}
async function hasCascadeRisk(client:Client){
 const result=await client.query<{refs:number}>(`SELECT count(*)::int AS refs FROM pg_constraint
 WHERE contype='f' AND confrelid='public.smn_member'::regclass AND confdeltype='c'`);
 return (result.rows[0]?.refs??0)>0;
}
export async function inspectMemberLifecycle(client:Client,id:string):Promise<LifecycleImpact>{
 if(!UUID.test(id))throw new Error("member-id-invalid");
 const state=await load(client,id,false);
 if(!state)throw new Error("member-not-found");
 const rows=await assignments(client,id,false);
 if(rows.some(a=>a.team_id!==state.teamId))throw new Error("member-out-of-scope");
 const [date,count,referenceCount]=await Promise.all([
  today(client),activeCount(client,state.teamId),references(client,id)]);
 return {memberId:id,teamId:state.teamId,displayName:state.member.display_name,
  revision:state.member.revision,archived:state.member.archived_at!==null,
  archivedAt:state.member.archived_at,today:date,activeCount:count,
  assignments:rows.map(r=>({id:r.id,teamId:r.team_id,startOn:r.start_on,endOn:r.end_on})),
  referenceCount,canDelete:rows.length===0&&referenceCount===0&&isEmpty(state.member)&&!await hasCascadeRisk(client)};
}
export async function applyLifecycleAction(client:Client,id:string,actorId:string,raw:unknown):Promise<LifecycleResult>{
 const input=parseLifecycleAction(raw);
 if(!input||!UUID.test(id)||!actorId)return {ok:false,error:"invalid-input"};
 await client.query("BEGIN");
 try{
  const stop=async(error:LifecycleError):Promise<LifecycleResult>=>{
   await client.query("ROLLBACK");return {ok:false,error};
  };
  const state=await load(client,id,true);
  if(!state)return stop("not-found");
  if(state.member.revision!==input.revision)return stop("conflict");
  const date=await today(client);
  const list=await assignments(client,id,true);
  if(list.some(a=>a.team_id!==state.teamId))return stop("team-unavailable");
  let dateOfAction=date,assignmentId:string|null=null,details:Record<string,unknown>={};
  if(input.action==="close"){
   if(state.member.archived_at!==null)return stop("already-archived");
   const row=list.find(a=>a.id===input.assignmentId);
   if(!row)return stop("assignment-not-found");
   if(row.end_on!==null)return stop("assignment-already-closed");
   if(input.endOn<row.start_on||input.endOn>date)return stop("invalid-date");
   const latest=await client.query<{latest:string|null}>(`SELECT max(effective_from)::text AS latest
     FROM public.smn_member_assignment_version WHERE assignment_id=$1`,[row.id]);
   if(latest.rows[0]?.latest&&input.endOn<latest.rows[0].latest!)return stop("future-version");
   await client.query(`UPDATE public.smn_member_assignment SET end_on=$1::date
     WHERE id=$2 AND member_id=$3 AND end_on IS NULL`,[input.endOn,row.id,id]);
   dateOfAction=input.endOn;assignmentId=row.id;details={teamId:state.teamId};
  }else if(input.action==="archive"){
   if(state.member.archived_at!==null)return stop("already-archived");
   if(list.some(a=>a.end_on===null))return stop("assignment-still-open");
   await client.query(`UPDATE public.smn_member SET archived_at=now(),archived_by=$1,
     revision=revision+1,updated_at=now() WHERE id=$2 AND installation_id='singleton'`,[actorId,id]);
  }else if(input.action==="reactivate"){
   if(state.member.archived_at===null)return stop("not-archived");
   if(list.some(a=>a.end_on===null))return stop("assignment-still-open");
   await client.query(`UPDATE public.smn_member SET archived_at=NULL,archived_by=NULL,
     revision=revision+1,updated_at=now() WHERE id=$1 AND installation_id='singleton'`,[id]);
  }else{
   if(list.length>0||await references(client,id)>0)return stop("historical-references");
   if(!isEmpty(state.member))return stop("business-data");
   if(await hasCascadeRisk(client))return stop("cascade-risk");
   await client.query(`DELETE FROM public.smn_member WHERE id=$1
    AND installation_id='singleton'`,[id]);
   details={confirmed:true};
  }
  if(input.action==="close"){
   await client.query(`UPDATE public.smn_member SET revision=revision+1,updated_at=now()
    WHERE id=$1 AND installation_id='singleton'`,[id]);
  }
  await client.query(`INSERT INTO public.smn_member_lifecycle_event
   (id,member_id,assignment_id,action,effective_on,performed_by,details)
   VALUES($1,$2,$3,$4,$5::date,$6,$7::jsonb)`,
   [randomUUID(),id,assignmentId,input.action,dateOfAction,actorId,JSON.stringify(details)]);
  const count=await activeCount(client,state.teamId);
  await client.query("COMMIT");
  return {ok:true,action:input.action,revision:input.revision+1,activeCount:count,
   warning:input.action==="close"&&count<3?"team-below-three":null};
 }catch(error){
  await client.query("ROLLBACK").catch(()=>undefined);
  throw error;
 }
}
