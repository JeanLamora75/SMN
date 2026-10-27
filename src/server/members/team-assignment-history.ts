import type {Client} from "pg";
import {resolveAdminTeam,type TeamActor} from "@/server/teams/resolve";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const TEAM=/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/;
export type TeamAssignmentRevision=Readonly<{
 assignmentId:string;startOn:string;endOn:string|null;
 revision:number;effectiveFrom:string;contractPercent:number;
 allocationPercent:number;contributionPercent:number;
 scrumMasterPercent:number;productOwnerPercent:number;developerPercent:number;
}>;
export type TeamAssignmentHistory=Readonly<{
 memberId:string;teamId:string;versions:readonly TeamAssignmentRevision[];
}>;

/** Versions historiques limitées aux affectations ayant appartenu à l'équipe
 * autorisée. Aucun événement d'une autre équipe, aucune fiche d'identité,
 * aucun historique individuel non contextualisé n'est retourné.
 */
export async function readTeamAssignmentHistory(db:Client,actor:TeamActor,
 memberId:unknown,requestedTeamId:unknown):Promise<TeamAssignmentHistory>{
 if(typeof memberId!=="string"||!UUID.test(memberId)||
    typeof requestedTeamId!=="string"||!TEAM.test(requestedTeamId))
  throw Error("team-assignment-history-invalid-input");
 const team=await resolveAdminTeam(db,actor,requestedTeamId);
 const rows=await db.query<{
  assignment_id:string;start_on:string;end_on:string|null;
  revision:number;effective_from:string;contract_percent:number;
  allocation_percent:number;contribution_percent:number;
  scrum_master_percent:number;product_owner_percent:number;developer_percent:number;
 }>(`
 SELECT a.id AS assignment_id,a.start_on::text AS start_on,
  a.end_on::text AS end_on,v.revision,
  v.effective_from::text AS effective_from,
  v.contract_percent,v.allocation_percent,v.contribution_percent,
  v.scrum_master_percent,v.product_owner_percent,v.developer_percent
 FROM public.smn_member_assignment a
 JOIN public.smn_member_assignment_version v ON v.assignment_id=a.id
 JOIN public.smn_team t ON t.id=a.team_id
 JOIN public.smn_member m ON m.id=a.member_id
 WHERE a.member_id=$1 AND a.team_id=$2
  AND t.installation_id='singleton'
  AND m.installation_id=t.installation_id
 ORDER BY a.start_on DESC,v.effective_from DESC,v.revision DESC
 LIMIT 501`,[memberId,team.team_id]);
 if(!rows.rows.length)throw Error("member-out-of-team");
 if(rows.rows.length>500)throw Error("team-assignment-history-limit");
 return {
  memberId,teamId:team.team_id,
  versions:rows.rows.map(r=>({
   assignmentId:r.assignment_id,startOn:r.start_on,endOn:r.end_on,
   revision:r.revision,effectiveFrom:r.effective_from,
   contractPercent:r.contract_percent,allocationPercent:r.allocation_percent,
   contributionPercent:r.contribution_percent,
   scrumMasterPercent:r.scrum_master_percent,
   productOwnerPercent:r.product_owner_percent,
   developerPercent:r.developer_percent
  }))
 };
}
