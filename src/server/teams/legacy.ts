import type {Client} from "pg";
import {withAuthDb} from "@/server/auth/database";

/** Préserve les parcours historiques v1-v27, échoue fermé en v28.
 * À remplacer par des requêtes vérifiant systématiquement le teamId pour
 * les lecteurs et mutations de réunions/capacités individuelles.
 */
export async function assertLegacyTeamApi(db:Client):Promise<void>{
 const status=await db.query<{schema_version:number}>(`
  SELECT schema_version FROM public.smn_installation
  WHERE id='singleton' AND state='initialized'`);
 const version=status.rows[0]?.schema_version;
 if(status.rows.length!==1||typeof version!=="number"||
    !Number.isSafeInteger(version)||version<1||version>27)
   throw Error("team-api-context-isolation-pending");
}

export function withLegacyTeamApi<T>(run:(db:Client)=>Promise<T>):Promise<T>{
 return withAuthDb(async db=>{
  await assertLegacyTeamApi(db);
  return run(db);
 });
}
