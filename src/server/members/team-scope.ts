import type {Client} from "pg";
import {resolveAdminTeam,type TeamActor} from "@/server/teams/resolve";
import {withAuthDb} from "@/server/auth/database";

/**
 * Protège les API historiques individuelles : elles exposent des événements,
 * absences et données personnelles sans attribution explicite à une équipe.
 * Tant que leurs lecteurs/écritures ne sont pas refondus, l'API v28 échoue
 * fermée. La version 27 conserve le comportement validé.
 */
export async function assertLegacyMemberApi(db:Client):Promise<void>{
 const result=await db.query<{schema_version:number}>(`
  SELECT schema_version FROM public.smn_installation
  WHERE id='singleton' AND state='initialized'`);
 if(result.rows.length!==1||
    !Number.isSafeInteger(result.rows[0].schema_version)||
    result.rows[0].schema_version<1||
    result.rows[0].schema_version>27)
  throw new Error("member-api-team-isolation-pending");
}

/** Encapsule les anciennes routes membres (GET/POST/PATCH/PUT).
 * Même connexion, garde exécutée avant toute lecture ou mutation métier.
 */
export function withLegacyMemberApi<T>(operation:(db:Client)=>Promise<T>):Promise<T>{
 return withAuthDb(async db=>{
  await assertLegacyMemberApi(db);
  return operation(db);
 });
}

/** Futur point d'entrée des fiches en v28 : sélection de l'équipe et
 * appartenance de la personne vérifiées dans la même installation.
 * Une simple connaissance d'un ID membre n'accorde aucun accès.
 * Ce contrôle ne garantit PAS encore que les historiques personnels soient
 * limités à l'époque ou au périmètre de l'équipe ; les endpoints anciens
 * restent bloqués et ne doivent pas invoquer directement leurs anciens lecteurs.
 */
export async function requireTeamMemberScope(db:Client,actor:TeamActor,
 memberId:string,requestedTeamId?:string|null):Promise<{teamId:string;memberId:string}>{
 if(typeof memberId!=="string"||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(memberId))
  throw new Error("member-id-invalid");
 const team=await resolveAdminTeam(db,actor,requestedTeamId);
 const memberships=await db.query<{member_id:string}>(`
  SELECT a.member_id FROM public.smn_member_assignment a
  JOIN public.smn_member m ON m.id=a.member_id
  JOIN public.smn_team t ON t.id=a.team_id
  WHERE a.member_id=$1 AND a.team_id=$2
    AND m.installation_id=t.installation_id
    AND t.installation_id='singleton'
    AND a.start_on<=CURRENT_DATE
    AND (a.end_on IS NULL OR a.end_on>=CURRENT_DATE)
  LIMIT 2`,[memberId,team.team_id]);
 if(memberships.rows.length!==1)throw new Error("member-out-of-team");
 return {teamId:team.team_id,memberId};
}
