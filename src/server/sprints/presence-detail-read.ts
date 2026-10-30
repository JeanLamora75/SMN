import type {Client} from "pg";
import type {SprintContextItem} from "@/lib/sprint-context";
import {readDevelopmentCapacity} from "@/server/capacity/engine";
import {readSprintMemberMetadata} from "./presence-metadata-read";
import {
 presenceFromCapacity,presenceFromSnapshot,sprintPresenceDates,
 type SprintPresence
} from "@/lib/sprint-presence";

/** Inputs must be obtained from the team's authorized server-side Sprint context.
 * The caller must additionally check read members (admin-only in MVP). */
export async function readSprintMemberPresence(
 db:Client,teamId:string,sprint:SprintContextItem
):Promise<SprintPresence|null>{
 const scope=await db.query<{status:string}>(`
  SELECT s.status FROM public.smn_sprint s
  JOIN public.smn_team t ON t.id=s.team_id
  JOIN public.smn_installation i ON i.id=t.installation_id
  WHERE s.id=$1 AND s.team_id=$2 AND s.deleted_at IS NULL
   AND i.id='singleton' AND i.state='initialized' AND lower(COALESCE(NULLIF(to_jsonb(t)->>'agile_mode',''),to_jsonb(i)->>'mode'))='scrum'
   AND (i.schema_version<32 OR COALESCE((to_jsonb(t)->>'is_archived')::boolean,false)=false)
 `,[sprint.id,teamId]);
 if(!scope.rows[0])return null;
 if(scope.rows[0].status==="closed"){
  const exists=await db.query<{present:boolean}>(`
   SELECT to_regclass('public.smn_sprint_closure_snapshot') IS NOT NULL AS present`);
  if(!exists.rows[0]?.present)return {state:"unavailable",reason:"history-missing"};
  const result=await db.query<{version:number;snapshot:unknown}>(`
   SELECT version,snapshot FROM public.smn_sprint_closure_snapshot
   WHERE sprint_id=$1 ORDER BY version DESC LIMIT 1`,[sprint.id]);
  const latest=result.rows[0];
  if(!latest||!Number.isSafeInteger(latest.version)||latest.version<1)
   return {state:"unavailable",reason:"history-missing"};
  const doc=latest.snapshot;
  const value=doc&&typeof doc==="object"&&!Array.isArray(doc)?
   (doc as Record<string,unknown>).memberPresence:null;
  return presenceFromSnapshot(value,latest.version);
 }
 const required=[
  "smn_capacity_settings","smn_member_assignment","smn_member",
  "smn_member_assignment_version","smn_member_calendar_week",
  "smn_member_calendar_exception","smn_member_location",
  "smn_member_absence","smn_member_absence_history",
  "smn_company_closure","smn_national_holiday",
  "smn_national_calendar_coverage"
 ];
 const present=await db.query<{table_name:string}>(`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema='public' AND table_name=ANY($1::text[])`,[required]);
 const installed=new Set(present.rows.map(r=>r.table_name));
 if(required.some(table=>!installed.has(table)))
  return {state:"unavailable",reason:"schema-missing"};
 // Contain a legacy schema/query failure so it does not poison the caller's
 // surrounding READ ONLY transaction or a closure's outer write transaction.
 await db.query("SAVEPOINT smn_presence_detail");
 try{
  const period=sprintPresenceDates(sprint);
  const capacity=await readDevelopmentCapacity(db,period.start,period.end,{
   externalTransaction:true,includeExceptionalImpact:false,teamId
  });
  if(capacity.team.id!==teamId||capacity.team.mode!=="scrum")
   throw Error("presence-team-mismatch");
  const projection=presenceFromCapacity(capacity);
  // Optional display attributes must never make the J/H calculation fail.
  // This nested savepoint also clears SQLSTATE 42703 on older installations.
  await db.query("SAVEPOINT smn_presence_metadata");
  let enriched=projection;
  try{
   const metadata=await readSprintMemberMetadata(db,teamId,period.start,period.end,
    capacity.members.map(member=>({
     memberId:member.memberId,dates:member.days.map(day=>day.date)
    })));
   enriched={...projection,members:projection.members.map(member=>({
    ...member,...(metadata.get(member.memberId)??{})
   }))};
   await db.query("RELEASE SAVEPOINT smn_presence_metadata");
  }catch{
   await db.query("ROLLBACK TO SAVEPOINT smn_presence_metadata");
   await db.query("RELEASE SAVEPOINT smn_presence_metadata");
  }
  await db.query("RELEASE SAVEPOINT smn_presence_detail");
  return enriched;
 }catch{
  await db.query("ROLLBACK TO SAVEPOINT smn_presence_detail");
  await db.query("RELEASE SAVEPOINT smn_presence_detail");
  return {state:"unavailable",reason:"read-failed"};
 }
}
