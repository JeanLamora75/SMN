import {withAuthDb} from "@/server/auth/database";
/** Legacy Fxx editing and projection endpoints are retired for the native v33 catalog.
 * Older supported installations keep their historical routes until database cleanup. */
export async function legacyIndicatorEndpointRetired():Promise<boolean>{
 return withAuthDb(async db=>{
  const result=await db.query<{schema_version:number}>(
   "SELECT schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'");
  return result.rows[0]?.schema_version===33;
 });
}
