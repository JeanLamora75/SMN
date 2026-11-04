import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {parseAssignmentInput} from "@/server/members/assignment";
import {resolveAdminTeam,type TeamActor} from "@/server/teams/resolve";

/** Business role transition, NOT a correction. Supports effective dates inside
 * both active and ended assignments; appends one immutable effective-dated row.
 * Closed periods and archived capacity are never re-written.
 */
export async function addDatedTeamRoleChange(db:Client,actor:TeamActor,
 memberId:string,raw:unknown){
 const input=parseAssignmentInput(raw);
 if(!input||input.memberId!==memberId||input.revision<1)
  return {ok:false as const,error:"invalid-input"};
 if(actor.role!=="admin")throw Error("team-access-forbidden");
 await db.query("BEGIN");
 try{
  const fail=async(error:"not-found"|"archived"|"outside-assignment"|
   "conflict"|"duplicate-date"|"frozen-period"|"unchanged")=>{
   await db.query("ROLLBACK");return {ok:false as const,error};
  };
  const team=await resolveAdminTeam(db,actor,input.teamId);
  const member=await db.query<{archived_at:string|null}>(`
   SELECT archived_at::text AS archived_at FROM public.smn_member
   WHERE id=$1 AND installation_id='singleton' FOR UPDATE`,[memberId]);
  if(member.rows.length!==1)return fail("not-found");
  if(member.rows[0].archived_at!==null)return fail("archived");
  const assignments=await db.query<{id:string;start_on:string;end_on:string|null}>(`
   SELECT id,start_on::text,end_on::text FROM public.smn_member_assignment
   WHERE member_id=$1 AND team_id=$2 AND start_on<=$3::date
    AND (end_on IS NULL OR end_on>=$3::date) FOR UPDATE`,
   [memberId,team.team_id,input.effectiveFrom]);
  if(assignments.rows.length!==1)return fail("outside-assignment");
  const assignment=assignments.rows[0];
  const rows=await db.query<{revision:number;effective_from:string;
   contract_percent:number;allocation_percent:number;contribution_percent:number;
   scrum_master_percent:number;product_owner_percent:number;developer_percent:number}>(`
   SELECT revision,effective_from::text AS effective_from,contract_percent,
    allocation_percent,contribution_percent,scrum_master_percent,
    product_owner_percent,developer_percent
   FROM public.smn_member_assignment_version
   WHERE assignment_id=$1 ORDER BY effective_from,revision FOR UPDATE`,[assignment.id]);
  if(!rows.rows.length||Math.max(...rows.rows.map(v=>v.revision))!==input.revision)
   return fail("conflict");
  if(rows.rows.some(v=>v.effective_from===input.effectiveFrom))
   return fail("duplicate-date");
  const previous=rows.rows.filter(v=>v.effective_from<input.effectiveFrom).at(-1);
  if(!previous)return fail("outside-assignment");
  const equivalent=(v:typeof previous)=>v&&
   v.contract_percent===input.contractPercent&&
   v.allocation_percent===input.allocationPercent&&
   v.contribution_percent===input.contributionPercent&&
   v.scrum_master_percent===input.shares.scrumMaster&&
   v.product_owner_percent===input.shares.productOwner&&
   v.developer_percent===input.shares.developer;
  if(equivalent(previous))return fail("unchanged");
  const next=rows.rows.find(v=>v.effective_from>input.effectiveFrom);
  // The newly inserted version is effective only until the next change.
  // Validate the *affected interval*, not the entire membership.
  const affectedEnd=next?
   new Date(Date.parse(next.effective_from+"T00:00:00Z")-86400000).toISOString().slice(0,10):
   assignment.end_on;
  const params=[team.team_id,input.effectiveFrom,affectedEnd];
  const frozen=await db.query(`
   SELECT 1 FROM public.smn_sprint s
   WHERE s.team_id=$1 AND
    (s.status='closed' OR EXISTS(SELECT 1 FROM public.smn_sprint_closure_snapshot
      snap WHERE snap.sprint_id=s.id))
    AND (s.start_at AT TIME ZONE s.time_zone)::date<=COALESCE($3::date,'infinity'::date)
    AND (s.end_at AT TIME ZONE s.time_zone)::date>=$2::date LIMIT 1`,params);
  if(frozen.rows.length)return fail("frozen-period");
  const initial=await db.query(`
   SELECT 1 FROM public.smn_capacity_initial_snapshot snap
   JOIN public.smn_capacity_period_override period ON period.id=snap.period_id
   WHERE period.team_id=$1 AND period.start_on<=COALESCE($3::date,'infinity'::date)
    AND period.end_on>=$2::date LIMIT 1`,params);
  if(initial.rows.length)return fail("frozen-period");
  const archive=await db.query(`
   SELECT 1 FROM public.smn_report_pdf_archive r
   LEFT JOIN public.smn_sprint s ON s.id=r.cycle_id AND s.team_id=r.team_id
   WHERE r.team_id=$1 AND (s.id IS NULL OR (
    (s.start_at AT TIME ZONE s.time_zone)::date<=COALESCE($3::date,'infinity'::date)
    AND (s.end_at AT TIME ZONE s.time_zone)::date>=$2::date)) LIMIT 1`,params);
  if(archive.rows.length)return fail("frozen-period");
  const cancelled=await db.query<{max_revision:number|null}>(`
   SELECT MAX((details->>'cancelledRevision')::int) AS max_revision
   FROM public.smn_member_lifecycle_event
   WHERE assignment_id=$1 AND action='delete'
    AND details->>'kind'='assignment-version-cancellation'`,[assignment.id]);
  const revision=Math.max(input.revision,cancelled.rows[0]?.max_revision??0)+1;
  await db.query(`INSERT INTO public.smn_member_assignment_version
   (id,assignment_id,revision,allocation_percent,contract_percent,
    contribution_percent,effective_from,scrum_master_percent,
    product_owner_percent,developer_percent,created_by)
   VALUES($1,$2,$3,$4,$5,$6,$7::date,$8,$9,$10,$11)`,[
   randomUUID(),assignment.id,revision,input.allocationPercent,input.contractPercent,
   input.contributionPercent,input.effectiveFrom,input.shares.scrumMaster,
   input.shares.productOwner,input.shares.developer,actor.accountId]);
  await db.query("COMMIT");
  return {ok:true as const,revision,assignmentId:assignment.id,teamId:team.team_id};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
