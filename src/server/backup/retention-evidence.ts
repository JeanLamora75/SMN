import {lstat} from "node:fs/promises";
import {join} from "node:path";
import type {Client} from "pg";

const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;

/** Both immutable audit evidence and physical absence must agree.
 * A failed SQL query or unreadable directory is uncertainty, not deletion.
 */
export async function verifyRemovedRetentionPackage(
 db:Pick<Client,"query">,root:string,id:string
):Promise<boolean>{
 if(!UUID.test(id))throw Error("retention-evidence-invalid-id");
 const audit=await db.query<{n:string}>(
  "SELECT count(*)::text AS n FROM public.smn_backup_retention_audit "+
  "WHERE package_id=$1 AND action='package_deleted'",[id]);
 if(audit.rows[0]?.n!=="1")return false;
 const exists=await lstat(join(root,"packages",id)).then(()=>true,
  (err:NodeJS.ErrnoException)=>{
   if(err.code==="ENOENT")return false;
   throw err;
  });
 return !exists;
}
