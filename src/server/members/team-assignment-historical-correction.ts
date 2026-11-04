import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {parseAssignmentInput} from "@/server/members/assignment";
import {resolveAdminTeam,type TeamActor} from "@/server/teams/resolve";

/** Append-only correction of an effective-dated team assignment version.
 * Frozen cycle snapshots are never rewritten by this operation.
 */
export async function correctHistoricalTeamAssignment(db:Client,actor:TeamActor,
 memberId:string,raw:unknown){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false as const,error:"invalid-input"};
 const obj=raw as Record<string,unknown>;
 if(Object.keys(obj).sort().join(",")!==
  "allocationPercent,contractPercent,contributionPercent,effectiveFrom,memberId,revision,shares,teamId")
  return {ok:false as const,error:"invalid-input"};
 const input=parseAssignmentInput(raw);
 if(!input||input.memberId!==memberId||input.revision<1)return {ok:false as const,error:"invalid-input"};
 if(actor.role!=="admin")throw Error("team-access-forbidden");
 await db.query("BEGIN");
 try{
  const fail=async(error:"not-found"|"conflict"|"archived"|"outside-assignment")=>{
   await db.query("ROLLBACK");return {ok:false as const,error};
  };
  const team=await resolveAdminTeam(db,actor,input.teamId);
  const member=await db.query<{archived_at:string|null}>(`
   SELECT archived_at::text AS archived_at FROM public.smn_member
   WHERE id=$1 AND installation_id='singleton' FOR UPDATE`,[memberId]);
  if(!member.rows.length)return fail("not-found");
  if(member.rows[0].archived_at!==null)return fail("archived");
  const assignments=await db.query<{id:string;start_on:string;end_on:string|null}>(`
   SELECT id,start_on::text,end_on::text FROM public.smn_member_assignment
   WHERE member_id=$1 AND team_id=$2 AND start_on<=$3::date
    AND (end_on IS NULL OR end_on>=$3::date) FOR UPDATE`,
   [memberId,team.team_id,input.effectiveFrom]);
  if(!assignments.rows.length)return fail("outside-assignment");
  if(assignments.rows.length!==1)return fail("conflict");
  const assignment=assignments.rows[0];
  const revisions=await db.query<{revision:number}>(`
   SELECT revision FROM public.smn_member_assignment_version
   WHERE assignment_id=$1 ORDER BY revision DESC LIMIT 1 FOR UPDATE`,
   [assignment.id]);
  const latest=revisions.rows[0]?.revision;
  if(latest!==input.revision)return fail("conflict");
  // The corrected effective date must already exist: do not silently create
  // a different historical period or overwrite a prior revision.
  const existing=await db.query<{id:string}>(`
   SELECT id FROM public.smn_member_assignment_version
   WHERE assignment_id=$1 AND effective_from=$2::date LIMIT 1`,
   [assignment.id,input.effectiveFrom]);
  if(!existing.rows.length)return fail("outside-assignment");
  // Never reuse a revision number already cancelled and preserved in audit.
  const cancelled=await db.query<{max_revision:number|null}>(`
   SELECT MAX((details->>'cancelledRevision')::int) AS max_revision
   FROM public.smn_member_lifecycle_event
   WHERE assignment_id=$1 AND action='delete'
    AND details->>'kind'='assignment-version-cancellation'`,[assignment.id]);
  const revision=Math.max(latest,cancelled.rows[0]?.max_revision??0)+1;
  await db.query(`INSERT INTO public.smn_member_assignment_version
   (id,assignment_id,revision,allocation_percent,contract_percent,
    contribution_percent,effective_from,scrum_master_percent,
    product_owner_percent,developer_percent,created_by)
   VALUES($1,$2,$3,$4,$5,$6,$7::date,$8,$9,$10,$11)`,
   [randomUUID(),assignment.id,revision,input.allocationPercent,
    input.contractPercent,input.contributionPercent,input.effectiveFrom,
    input.shares.scrumMaster,input.shares.productOwner,input.shares.developer,
    actor.accountId]);
  await db.query("COMMIT");
  return {ok:true as const,revision,assignmentId:assignment.id,teamId:team.team_id};
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
