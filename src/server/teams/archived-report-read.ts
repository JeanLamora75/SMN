import type {Client} from "pg";
import type {TeamActor} from "./resolve";

const validId=(value:unknown):value is string=>
 typeof value==="string"&&/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(value);

/** Explicit team-scoped, read-only access to historical Scrum archives.
 * Never reuse for team mutations; archived teams remain non-writable.
 */
export async function assertAdminArchivedReportRead(
 db:Client,actor:TeamActor,teamId:string
):Promise<void>{
 if(actor.role!=="admin"||!validId(actor.accountId)||!validId(teamId))
  throw Error("archive-team-forbidden");
 const rows=await db.query<{id:string}>(`
  SELECT t.id FROM public.smn_team t
  JOIN public.smn_installation i ON i.id=t.installation_id
  JOIN public.smn_account a ON a.installation_id=i.id
  WHERE t.id=$1 AND a.id=$2 AND a.role='admin' AND a.is_active=true
   AND a.must_change_password=false AND i.id='singleton'
   AND i.state='initialized' AND i.schema_version=29
   AND t.agile_mode='scrum' AND t.is_archived=true LIMIT 2`,
  [teamId,actor.accountId]);
 if(rows.rows.length!==1)throw Error("archive-team-unavailable");
}
