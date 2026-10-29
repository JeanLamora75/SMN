import type {Client} from "pg";
import {resolveAdminTeam,type TeamActor,type TeamContextRow} from "@/server/teams/resolve";

/** Détermine explicitement la politique de lecture des registres.
 * v27 garde la monoéquipe historique ; v28 exige un Admin et une équipe
 * résolue depuis sa propre installation. Aucun fallback au premier teamId.
 */
export async function resolveRegistryReadContext(
 db:Client,actor:TeamActor,requestedTeamId:string|null
):Promise<Readonly<{version:27|28;team?:TeamContextRow}>>{
 const state=await db.query<{schema_version:number}>(`
  SELECT schema_version FROM public.smn_installation
  WHERE id='singleton' AND state='initialized'`);
 if(state.rows.length!==1)throw Error("registry-schema-unavailable");
 const version=state.rows[0].schema_version;
 if(version===28||version===29||version===30||version===31||version===32)return {
  version:28,team:await resolveAdminTeam(db,actor,requestedTeamId)
 };
 if(Number.isSafeInteger(version)&&version>=1&&version<=27)
  return {version:27};
 throw Error("registry-schema-unavailable");
}
