import type {Client} from "pg";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {assertLegacyTeamApi} from "@/server/teams/legacy";

/** Les anciennes APIs de rapports, exports et archives sont monoéquipe.
 * Avant la qualification des droits teamId/archives, elles ne peuvent
 * consulter une installation v28, même si l'identifiant direct est connu.
 * La vérification est faite dans la même connexion et transaction READ ONLY.
 */
export async function withLegacyReportReadDb<T>(
 read:(db:Client)=>Promise<T>
):Promise<T>{
 return withSprintIndexDb(async db=>{
  await assertLegacyTeamApi(db);
  return read(db);
 });
}
