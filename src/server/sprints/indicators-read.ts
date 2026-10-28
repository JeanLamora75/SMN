import type {Client} from "pg";
import {
 type SprintPoints,type SprintTickets,type SprintScores
} from "@/lib/sprint-indicator-values";

type Reason="schema-missing"|"history-missing"|"read-failed";
type DataGroup<T>=
 |Readonly<{state:"available";values:T;revision:number}>
 |Readonly<{state:"unavailable";reason:Reason}>;
export type SprintIndicatorProjection=Readonly<{
 state:"available";source:"manual"|"closure-snapshot";snapshotVersion:number|null;
 points:DataGroup<SprintPoints>;tickets:DataGroup<SprintTickets>;
 scores:DataGroup<SprintScores>;
}>;
export type SprintDetailIndicators=SprintIndicatorProjection|
 Readonly<{state:"unavailable";reason:Reason}>;

const record=(v:unknown):Record<string,unknown>|null=>
 v!==null&&typeof v==="object"&&!Array.isArray(v)?
 v as Record<string,unknown>:null;
function numberOrNull(v:unknown,max:number,min=0):number|null|undefined{
 if(v===undefined||v===null)return null;
 if(typeof v!=="string"&&typeof v!=="number")return undefined;
 if(typeof v==="string"&&(v.trim()===""||!/^(0|[1-9]\d*)$/.test(v)))return undefined;
 const value=Number(v);
 return Number.isSafeInteger(value)&&value>=min&&value<=max?value:undefined;
}
function parseGroup<T>(
 raw:unknown,value:(record:Record<string,unknown>)=>T|null
):DataGroup<T>{
 if(raw===null)return {state:"available",values:value({})!,revision:0};
 const item=record(raw);
 if(!item)return {state:"unavailable",reason:"read-failed"};
 const parsed=value(item);
 if(!parsed)return {state:"unavailable",reason:"read-failed"};
 const revision=item.revision===undefined?0:item.revision;
 if(!Number.isSafeInteger(revision)||Number(revision)<0)
  return {state:"unavailable",reason:"read-failed"};
 return {state:"available",values:parsed,revision:revision as number};
}
function pointsFrom(raw:unknown):DataGroup<SprintPoints>{
 return parseGroup(raw,v=>{
  const values=["initial","added","removed","done"].map(k=>
   numberOrNull(v[k],1000000000));
  if(values.some(x=>x===undefined))return null;
  return {initial:values[0]!,added:values[1]!,removed:values[2]!,done:values[3]!};
 });
}
function ticketsFrom(raw:unknown):DataGroup<SprintTickets>{
 return parseGroup(raw,v=>{
  const a=numberOrNull(v.initial,1000000000),b=numberOrNull(v.done,1000000000);
  return a===undefined||b===undefined?null:{initial:a,done:b};
 });
}
function scoresFrom(raw:unknown):DataGroup<SprintScores>{
 return parseGroup(raw,v=>{
  const a=numberOrNull(v.confidence,5,1),b=numberOrNull(v.clarity,5,1);
  return a===undefined||b===undefined?null:{confidence:a,clarity:b};
 });
}
const absent=(reason:Reason):DataGroup<never>=>({state:"unavailable",reason});

/** No schema creation, no mutation, no unscoped user data. */
export async function readSprintDetailIndicators(
 db:Client,teamId:string,sprintId:string
):Promise<SprintDetailIndicators|null>{
 const scope=await db.query<{status:string}>(`
 SELECT s.status FROM public.smn_sprint s
 JOIN public.smn_team t ON t.id=s.team_id
 JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE s.id=$1 AND s.team_id=$2 AND s.deleted_at IS NULL
 AND i.id='singleton' AND i.state='initialized' AND lower(COALESCE(NULLIF(to_jsonb(t)->>'agile_mode',''),i.mode))='scrum'
 `,[sprintId,teamId]);
 if(!scope.rows[0])return null;
 if(scope.rows[0].status==="closed"){
  const has=await db.query<{present:boolean}>(`
   SELECT to_regclass('public.smn_sprint_closure_snapshot') IS NOT NULL AS present`);
  if(!has.rows[0]?.present)return {state:"unavailable",reason:"history-missing"};
  const snapshots=await db.query<{version:number;snapshot:unknown}>(`
   SELECT version,snapshot FROM public.smn_sprint_closure_snapshot
   WHERE sprint_id=$1 ORDER BY version DESC LIMIT 1`,[sprintId]);
  const latest=snapshots.rows[0];
  if(!latest||!Number.isSafeInteger(latest.version)||latest.version<1)
   return {state:"unavailable",reason:"history-missing"};
  const snap=record(latest.snapshot);
  if(!snap)return {state:"unavailable",reason:"read-failed"};
  // Old V1 snapshots can lack sources; never synthesize them from current records.
  const sp=record(snap.storyPoints),ticket=record(snap.ticketCounts);
  const scores=record(snap.confidenceClarity);
  return {state:"available",source:"closure-snapshot",snapshotVersion:latest.version,
   points:snap.storyPoints===undefined?absent("history-missing"):
    snap.storyPoints!==null&&!sp?absent("read-failed"):pointsFrom(sp?{
     initial:sp.initial_sp,added:sp.added_sp,
     removed:sp.removed_sp,done:sp.done_sp}:null),
   tickets:snap.ticketCounts===undefined?absent("history-missing"):
    snap.ticketCounts!==null&&!ticket?absent("read-failed"):ticketsFrom(ticket?{initial:ticket.initial_tickets,done:ticket.done_tickets}:null),
   scores:snap.confidenceClarity===undefined?absent("history-missing"):
    snap.confidenceClarity!==null&&!scores?absent("read-failed"):scoresFrom(scores?{
     confidence:scores.confidence,clarity:scores.clarity}:null)
  };
 }
 const available=await db.query<{points:boolean;tickets:boolean;scores:boolean}>(`
  SELECT
   to_regclass('public.smn_sprint_story_points') IS NOT NULL AS points,
   to_regclass('public.smn_sprint_ticket_counts') IS NOT NULL AS tickets,
   to_regclass('public.smn_sprint_scores') IS NOT NULL AS scores`);
 const installed=available.rows[0]??{points:false,tickets:false,scores:false};
 const points=installed.points?await db.query<{
  initial:string|null;added:string|null;removed:string|null;done:string|null;revision:number
 }>(`SELECT initial_sp::text AS initial,added_sp::text AS added,
   removed_sp::text AS removed,done_sp::text AS done,revision
   FROM public.smn_sprint_story_points WHERE sprint_id=$1`,[sprintId]):null;
 const tickets=installed.tickets?await db.query<{
  initial:string|null;done:string|null;revision:number
 }>(`SELECT initial_tickets::text AS initial,done_tickets::text AS done,revision
   FROM public.smn_sprint_ticket_counts WHERE sprint_id=$1`,[sprintId]):null;
 const scores=installed.scores?await db.query<{
  confidence:number|null;clarity:number|null;revision:number
 }>(`SELECT confidence,clarity,revision FROM public.smn_sprint_scores
   WHERE sprint_id=$1`,[sprintId]):null;
 return {state:"available",source:"manual",snapshotVersion:null,
  // The uninstalled table is equivalent to no values yet on an editable Sprint:
  // mutations create it on explicit admin save. Null is never changed to zero.
  points:pointsFrom(points?.rows[0]??null),
  tickets:ticketsFrom(tickets?.rows[0]??null),
  scores:scoresFrom(scores?.rows[0]??null)};
}
