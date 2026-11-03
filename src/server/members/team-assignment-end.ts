import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {isValidDate} from "./assignment";
import {resolveAdminTeam,type TeamActor} from "@/server/teams/resolve";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type Input={teamId:string;assignmentId:string;endOn:string;revision:number;latestRevision:number;reason:string|null};
export function parseTeamAssignmentEnd(raw:unknown):Input|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).sort().join(",")!=="assignmentId,endOn,latestRevision,reason,revision,teamId"||
  typeof v.teamId!=="string"||!/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(v.teamId)||
  typeof v.assignmentId!=="string"||!UUID.test(v.assignmentId)||
  !isValidDate(v.endOn)||typeof v.revision!=="number"||!Number.isSafeInteger(v.revision)||
  v.revision<0||typeof v.latestRevision!=="number"||!Number.isSafeInteger(v.latestRevision)||
  v.latestRevision<1||!(v.reason===null||(typeof v.reason==="string"&&
   v.reason.trim().length<=200&&!/[\u0000-\u001f\u007f]/.test(v.reason))))return null;
 return {teamId:v.teamId,assignmentId:v.assignmentId,endOn:v.endOn,
  revision:v.revision,latestRevision:v.latestRevision,
  reason:typeof v.reason==="string"?v.reason.trim()||null:null};
}
export async function endTeamAssignment(db:Client,actor:TeamActor,memberId:string,raw:unknown){
 const input=parseTeamAssignmentEnd(raw);
 if(!input||!UUID.test(memberId))return {ok:false as const,error:"invalid-input"};
 if(actor.role!=="admin")throw Error("team-access-forbidden");
 await db.query("BEGIN");
 try{
  const fail=async(error:"not-found"|"conflict"|"archived"|"invalid-date")=>{
   await db.query("ROLLBACK");return {ok:false as const,error};
  };
  const team=await resolveAdminTeam(db,actor,input.teamId);
  const member=await db.query<{revision:number;archived_at:string|null}>(`
   SELECT revision,archived_at::text AS archived_at FROM public.smn_member
   WHERE id=$1 AND installation_id='singleton' FOR UPDATE`,[memberId]);
  if(member.rows.length!==1)return fail("not-found");
  if(member.rows[0].archived_at!==null)return fail("archived");
  if(member.rows[0].revision!==input.revision)return fail("conflict");
  const assignment=await db.query<{start_on:string;end_on:string|null}>(`
   SELECT start_on::text,end_on::text FROM public.smn_member_assignment
   WHERE id=$1 AND member_id=$2 AND team_id=$3 FOR UPDATE`,
   [input.assignmentId,memberId,team.team_id]);
  const row=assignment.rows[0];
  if(!row)return fail("not-found");
  if(row.end_on!==null)return fail("conflict");
  if(input.endOn<row.start_on)return fail("invalid-date");
  const version=await db.query<{revision:number;effective_from:string}>(`
   SELECT revision,effective_from::text AS effective_from
   FROM public.smn_member_assignment_version WHERE assignment_id=$1
   ORDER BY revision DESC LIMIT 1`,[input.assignmentId]);
  const latest=version.rows[0];
  if(!latest||latest.revision!==input.latestRevision)return fail("conflict");
  // A closing date is bounded by the actual team assignment start, not by
  // the effective date of its latest role/allocation revision. Version
  // history remains immutable and optimistic revision checks remain active.
  await db.query(`UPDATE public.smn_member_assignment SET end_on=$1::date
   WHERE id=$2 AND member_id=$3 AND team_id=$4 AND end_on IS NULL`,
   [input.endOn,input.assignmentId,memberId,team.team_id]);
  await db.query(`UPDATE public.smn_member SET revision=revision+1,updated_at=now()
   WHERE id=$1 AND installation_id='singleton'`,[memberId]);
  await db.query(`INSERT INTO public.smn_member_lifecycle_event
   (id,member_id,assignment_id,action,effective_on,performed_by,details)
   VALUES($1,$2,$3,'close',$4::date,$5,$6::jsonb)`,
   [randomUUID(),memberId,input.assignmentId,input.endOn,actor.accountId,
    JSON.stringify({teamId:team.team_id,reason:input.reason})]);
  await db.query("COMMIT");
  return {ok:true as const,assignmentId:input.assignmentId,teamId:team.team_id,
   endOn:input.endOn,revision:input.revision+1};
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
