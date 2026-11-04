import {revisionImpactWindow,countAffectedClosedSprints} from "@/server/members/assignment-revision-impact";
import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {parseAssignmentInput} from "@/server/members/assignment";
import {resolveAdminTeam,type TeamActor} from "@/server/teams/resolve";

/** Corrects the selected historical revision without appending another role
 * revision. Before/after values are saved to the append-only lifecycle audit.
 * Never touch closed sprint capacity or frozen closure snapshots.
 */
export async function correctHistoricalTeamAssignment(db:Client,actor:TeamActor,
 memberId:string,raw:unknown){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false as const,error:"invalid-input"};
 const obj=raw as Record<string,unknown>;
 if(Object.keys(obj).sort().join(",")!==
  "allocationPercent,contractPercent,contributionPercent,effectiveFrom,memberId,revision,shares,targetRevision,teamId"||
  typeof obj.targetRevision!=="number"||!Number.isSafeInteger(obj.targetRevision)||
  obj.targetRevision<1)return {ok:false as const,error:"invalid-input"};
 const {targetRevision,...fields}=obj;
 const input=parseAssignmentInput(fields);
 if(!input||input.memberId!==memberId||input.revision<1)return {ok:false as const,error:"invalid-input"};
 if(actor.role!=="admin")throw Error("team-access-forbidden");
 await db.query("BEGIN");
 try{
  const fail=async(error:"not-found"|"conflict"|"archived"|"outside-assignment"|
   "frozen-period"|"unchanged")=>{
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
  const versions=await db.query<Record<string,unknown>&{id:string;revision:number;effective_from:string}>(`
   SELECT *,effective_from::text AS effective_from
   FROM public.smn_member_assignment_version
   WHERE assignment_id=$1 ORDER BY revision DESC FOR UPDATE`,[assignment.id]);
  if(versions.rows[0]?.revision!==input.revision)return fail("conflict");
  const selected=versions.rows.find(v=>v.revision===targetRevision);
  if(!selected||selected.effective_from!==input.effectiveFrom)return fail("outside-assignment");
  const values={
   allocation_percent:input.allocationPercent,contract_percent:input.contractPercent,
   contribution_percent:input.contributionPercent,scrum_master_percent:input.shares.scrumMaster,
   product_owner_percent:input.shares.productOwner,developer_percent:input.shares.developer
  };
  if(Object.entries(values).every(([k,v])=>Number(selected[k])===v))
   return fail("unchanged");
  const impact=revisionImpactWindow(versions.rows,selected,assignment.end_on);
  const affectedClosedSprints=await countAffectedClosedSprints(db,team.team_id,impact);
  await db.query(`INSERT INTO public.smn_member_lifecycle_event
   (id,member_id,assignment_id,action,effective_on,performed_by,details)
   VALUES($1,$2,$3,'delete',$4::date,$5,$6::jsonb)`,[
   randomUUID(),memberId,assignment.id,input.effectiveFrom,actor.accountId,
   JSON.stringify({kind:"assignment-version-correction",teamId:team.team_id,
    targetRevision,before:selected,after:values,reason:"data-entry-correction"})
  ]);
  const update=await db.query(`
   UPDATE public.smn_member_assignment_version SET
    allocation_percent=$1,contract_percent=$2,contribution_percent=$3,
    scrum_master_percent=$4,product_owner_percent=$5,developer_percent=$6
   WHERE id=$7 AND assignment_id=$8 AND revision=$9`,[
    input.allocationPercent,input.contractPercent,input.contributionPercent,
    input.shares.scrumMaster,input.shares.productOwner,input.shares.developer,
    selected.id,assignment.id,targetRevision
   ]);
  if(update.rowCount!==1)return fail("conflict");
  await db.query("COMMIT");
  return {ok:true as const,revision:targetRevision,assignmentId:assignment.id,
   teamId:team.team_id,corrected:true,affectedClosedSprints};
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
