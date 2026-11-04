import {revisionImpactWindow,countAffectedClosedSprints,type CapacityRevision} from "@/server/members/assignment-revision-impact";
import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {resolveAdminTeam,type TeamActor} from "@/server/teams/resolve";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TEAM=/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/;
type CancelInput={teamId:string;assignmentId:string;revision:number};
export function parseRevisionCancellation(raw:unknown):CancelInput|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).sort().join(",")!=="assignmentId,revision,teamId"||
  typeof v.teamId!=="string"||!TEAM.test(v.teamId)||
  typeof v.assignmentId!=="string"||!UUID.test(v.assignmentId)||
  typeof v.revision!=="number"||!Number.isSafeInteger(v.revision)||v.revision<=1)return null;
 return {teamId:v.teamId,assignmentId:v.assignmentId,revision:v.revision};
}

/** A targeted undo of the last accidental revision. The full row is preserved
 * in the immutable lifecycle audit before its removal from effective versions.
 * Strict fail-closed check: any closed sprint or closure snapshot in this team
 * prevents a retroactive capacity change. No renumbering is performed.
 */
export async function cancelLatestTeamAssignmentRevision(db:Client,actor:TeamActor,
 memberId:string,raw:unknown){
 const input=parseRevisionCancellation(raw);
 if(!input||!UUID.test(memberId))return {ok:false as const,error:"invalid-input"};
 if(actor.role!=="admin")throw Error("team-access-forbidden");
 await db.query("BEGIN");
 try{
  const fail=async(error:"not-found"|"conflict"|"archived"|"frozen-period")=>{
   await db.query("ROLLBACK");return {ok:false as const,error};
  };
  const team=await resolveAdminTeam(db,actor,input.teamId);
  const member=await db.query<{archived_at:string|null}>(`
   SELECT archived_at::text AS archived_at FROM public.smn_member
   WHERE id=$1 AND installation_id='singleton' FOR UPDATE`,[memberId]);
  if(member.rows.length!==1)return fail("not-found");
  if(member.rows[0].archived_at!==null)return fail("archived");
  const assignment=await db.query<{start_on:string;end_on:string|null}>(`
   SELECT start_on::text,end_on::text FROM public.smn_member_assignment
   WHERE id=$1 AND member_id=$2 AND team_id=$3 FOR UPDATE`,
   [input.assignmentId,memberId,team.team_id]);
  if(assignment.rows.length!==1)return fail("not-found");
  const versions=await db.query<Record<string,unknown>&CapacityRevision&{id:string}>(`
   SELECT *,effective_from::text AS effective_from FROM public.smn_member_assignment_version
   WHERE assignment_id=$1 ORDER BY revision DESC FOR UPDATE`,[input.assignmentId]);
  if(versions.rows.length<2||versions.rows[0].revision!==input.revision)
   return fail("conflict");
  const target=versions.rows[0];
  const impact=revisionImpactWindow(versions.rows,target,assignment.rows[0].end_on);
  const affectedClosedSprints=await countAffectedClosedSprints(db,team.team_id,impact);
  // Audit is written first, in the same transaction as the actual deletion.
  // This is not an unaudited deletion, and the original row is recoverable.
  await db.query(`INSERT INTO public.smn_member_lifecycle_event
   (id,member_id,assignment_id,action,effective_on,performed_by,details)
   VALUES($1,$2,$3,'delete',$4::date,$5,$6::jsonb)`,[
   randomUUID(),memberId,input.assignmentId,target.effective_from,actor.accountId,
   JSON.stringify({kind:"assignment-version-cancellation",teamId:team.team_id,
    cancelledRevision:target.revision,before:target,reason:"erroneous-entry",
    previousRevision:versions.rows[1].revision})
  ]);
  const deleted=await db.query(`DELETE FROM public.smn_member_assignment_version
   WHERE id=$1 AND assignment_id=$2 AND revision=$3`,
   [target.id,input.assignmentId,input.revision]);
  if(deleted.rowCount!==1)return fail("conflict");
  await db.query("COMMIT");
  return {ok:true as const,cancelledRevision:input.revision,
   restoredRevision:versions.rows[1].revision,affectedClosedSprints};
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
