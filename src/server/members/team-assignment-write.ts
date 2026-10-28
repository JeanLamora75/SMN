import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {parseAssignmentInput,isValidDate} from "@/server/members/assignment";
import {resolveAdminTeam,type TeamActor} from "@/server/teams/resolve";

export type TeamAssignmentWriteError=
 "invalid-input"|"not-found"|"archived"|"assignment-not-active"|
 "conflict"|"date-in-past"|"date-before-assignment"|"date-before-latest";
export type TeamAssignmentWriteResult=
 |Readonly<{ok:false;error:TeamAssignmentWriteError}>
 |Readonly<{ok:true;assignmentId:string;teamId:string;revision:number}>;

const invalid=(error:TeamAssignmentWriteError):TeamAssignmentWriteResult=>
 ({ok:false,error});

/** Version de répartition de rôle d'une affectation EXISTANTE, sans création
 * ni changement d'équipe. Tout est sérialisé dans une transaction PostgreSQL.
 * La route HTTP reste fermée par MULTI_TEAM_CONTEXT_READY=false.
 */
export async function saveTeamAssignmentRevision(
 db:Client,actor:TeamActor,memberId:string,raw:unknown
):Promise<TeamAssignmentWriteResult>{
 const input=parseAssignmentInput(raw);
 if(!input||input.memberId!==memberId||input.revision<1)
  return invalid("invalid-input");
 if(actor.role!=="admin")throw Error("team-access-forbidden");

 await db.query("BEGIN");
 try{
  const fail=async(error:TeamAssignmentWriteError):Promise<TeamAssignmentWriteResult>=>{
   await db.query("ROLLBACK");
   return invalid(error);
  };
  // Sécurité v28 : le compte Admin et le teamId sont résolus par le serveur,
  // pas depuis une simple préférence ou une déclaration du navigateur.
  const team=await resolveAdminTeam(db,actor,input.teamId);
  const member=await db.query<{id:string;archived_at:string|null}>(`
   SELECT m.id,m.archived_at::text AS archived_at
   FROM public.smn_member m
   JOIN public.smn_team t ON t.installation_id=m.installation_id
   WHERE m.id=$1 AND t.id=$2 AND t.installation_id='singleton'
    AND COALESCE((to_jsonb(t)->>'is_archived')::boolean,false)=false
   FOR UPDATE OF m`,[memberId,team.team_id]);
  if(member.rows.length!==1)return fail("not-found");
  if(member.rows[0].archived_at!==null)return fail("archived");

  // Uniquement une affectation OUVERTE de cette équipe : jamais création
  // implicite ni modification d'une ancienne équipe.
  const assignment=await db.query<{id:string;start_on:string;end_on:string|null}>(`
   SELECT a.id,a.start_on::text AS start_on,a.end_on::text AS end_on
   FROM public.smn_member_assignment a
   WHERE a.member_id=$1 AND a.team_id=$2 AND a.end_on IS NULL
   FOR UPDATE OF a`,[memberId,team.team_id]);
  if(assignment.rows.length!==1)return fail("assignment-not-active");
  const active=assignment.rows[0];
  const clock=await db.query<{today:string}>("SELECT CURRENT_DATE::text AS today");
  const today=clock.rows[0]?.today;
  if(!isValidDate(today))throw Error("members-clock-unavailable");
  if(input.effectiveFrom<today)return fail("date-in-past");
  if(input.effectiveFrom<active.start_on)return fail("date-before-assignment");

  const previous=await db.query<{revision:number;effective_from:string}>(`
   SELECT revision,effective_from::text AS effective_from
   FROM public.smn_member_assignment_version
   WHERE assignment_id=$1 ORDER BY revision DESC LIMIT 2`,[active.id]);
  const latest=previous.rows[0];
  if(!latest||!Number.isSafeInteger(latest.revision))
   return fail("conflict");
  if(input.revision!==latest.revision)return fail("conflict");
  if(input.effectiveFrom<latest.effective_from)
   return fail("date-before-latest");

  const next=latest.revision+1;
  if(!Number.isSafeInteger(next))return fail("conflict");
  await db.query(`INSERT INTO public.smn_member_assignment_version
   (id,assignment_id,revision,allocation_percent,contract_percent,
    contribution_percent,effective_from,scrum_master_percent,
    product_owner_percent,developer_percent,created_by)
   VALUES($1,$2,$3,$4,$5,$6,$7::date,$8,$9,$10,$11)`,[
    randomUUID(),active.id,next,input.allocationPercent,input.contractPercent,
    input.contributionPercent,input.effectiveFrom,input.shares.scrumMaster,
    input.shares.productOwner,input.shares.developer,actor.accountId
   ]);
  await db.query("COMMIT");
  return {ok:true,assignmentId:active.id,teamId:team.team_id,revision:next};
 }catch(error){
  await db.query("ROLLBACK").catch(()=>undefined);
  throw error;
 }
}
