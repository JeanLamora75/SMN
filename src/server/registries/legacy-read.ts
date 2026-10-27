import type {Client} from "pg";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {assertLegacyTeamApi} from "@/server/teams/legacy";

/** Bloque les lecteurs relationnels historiques qui se fondent sur l'ID seul.
 * En v28, aucun historique personnel, lien ou commentaire ne peut transiter
 * par les endpoints historiques non contextualisés. Compatibilité v27.
 */
export async function withLegacyRegistryReadDb<T>(
 read:(db:Client)=>Promise<T>
):Promise<T>{
 return withSprintIndexDb(async db=>{
  await assertLegacyTeamApi(db);
  return read(db);
 });
}
