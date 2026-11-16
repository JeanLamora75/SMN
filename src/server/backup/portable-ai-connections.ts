import type {Client} from "pg";
import {lstat,readdir} from "node:fs/promises";
import {join,resolve} from "node:path";

/** SMN-487: the portable encrypted PostgreSQL dump contains ONLY metadata.
 * No API credential or master key may be represented as a DB column or an
 * additional file. Keep this gate independent of actual API providers.
 */
const CONNECTION_COLUMNS=new Set([
 "id","installation_id","label","provider_id","model_id","enabled",
 "credential_state","last_test_status","last_test_at","revision",
 "created_by","created_at","updated_at"
]);
const RESPONSE_COLUMNS=new Set([
 "id","archive_id","team_id","author_id","response_text","provider","model",
 "created_at","updated_at","human_edited","deleted_at"
]);

async function relation(db:Pick<Client,"query">,name:string){
 const result=await db.query<{exists:boolean}>(
  "SELECT to_regclass($1)::text IS NOT NULL AS exists",["public."+name]);
 return result.rows[0]?.exists===true;
}
async function columns(db:Pick<Client,"query">,name:string){
 const result=await db.query<{column_name:string}>(`
  SELECT column_name FROM information_schema.columns
  WHERE table_schema='public' AND table_name=$1 ORDER BY column_name`,[name]);
 return result.rows.map(r=>r.column_name);
}
function checkColumns(actual:string[],allowed:ReadonlySet<string>,required:readonly string[]){
 if(actual.some(name=>!allowed.has(name))||required.some(name=>!actual.includes(name)))
  throw Error("migration-ai-schema-untrusted");
}
export type AiTransferInventory=Readonly<{
 connections:number;archives:number;responses:number;hasConnections:boolean;
}>;
/** Called on source and sandbox; read-only. No tables or extra files created. */
export async function inspectPortableAiTransfer(db:Pick<Client,"query">):Promise<AiTransferInventory>{
 const hasConnections=await relation(db,"smn_ai_connection");
 if(hasConnections){
  const actual=await columns(db,"smn_ai_connection");
  checkColumns(actual,CONNECTION_COLUMNS,["id","provider_id","model_id",
   "credential_state","enabled","revision","installation_id"]);
 }
 const hasArchives=await relation(db,"smn_ai_brief_archive");
 const hasResponses=await relation(db,"smn_ai_brief_response");
 if(hasResponses){
  checkColumns(await columns(db,"smn_ai_brief_response"),RESPONSE_COLUMNS,
   ["id","archive_id","team_id","response_text","provider","model","author_id"]);
  if(!hasArchives)throw Error("migration-ai-archive-missing");
 }
 async function count(name:string,exists:boolean){
  if(!exists)return 0;
  const row=await db.query<{n:string}>(`SELECT count(*)::text AS n FROM public.${name}`);
  const n=Number(row.rows[0]?.n);
  if(!Number.isSafeInteger(n)||n<0)throw Error("migration-ai-count-invalid");
  return n;
 }
 return {hasConnections,connections:await count("smn_ai_connection",hasConnections),
  archives:await count("smn_ai_brief_archive",hasArchives),
  responses:await count("smn_ai_brief_response",hasResponses)};
}

/** Destination vault may not be implicitly reused or silently discarded.
 * If it contains any local files, the owner must reset it through SMN first,
 * with no file deletes or PowerShell in this cutover.
 */
export async function assertPortableDestinationVaultEmpty(root=process.cwd()){
 const data=join(resolve(root),"data"),folder=join(data,"ai-secrets");
 const parent=await lstat(data).catch((e:NodeJS.ErrnoException)=>{
  if(e.code==="ENOENT")return null;
  throw e;
 });
 if(parent&&(!parent.isDirectory()||parent.isSymbolicLink()))
  throw Error("migration-ai-vault-untrusted");
 const stat=await lstat(folder).catch((e:NodeJS.ErrnoException)=>{
  if(e.code==="ENOENT")return null;
  throw e;
 });
 if(!stat)return;
 if(!stat.isDirectory()||stat.isSymbolicLink())
  throw Error("migration-ai-vault-untrusted");
 if((await readdir(folder)).length!==0)
  throw Error("migration-ai-vault-not-empty");
}

/** Only called after source/candidate row fingerprints and privacy evidence
 * have been verified, with the SMN web process stopped and maintenance held.
 * All connections become inactive; original IDs/revisions are retained.
 * No responses, archives, teams, or original TXT are edited.
 */
export async function quarantineRestoredAiConnections(db:Client){
 await db.query("BEGIN");
 try{
  const before=await inspectPortableAiTransfer(db);
  if(before.hasConnections){
   await db.query(`UPDATE public.smn_ai_connection
    SET enabled=false,credential_state='missing',
        last_test_status='never',last_test_at=NULL,updated_at=now()
    WHERE enabled=true OR credential_state<>'missing'
       OR last_test_status<>'never' OR last_test_at IS NOT NULL`);
   const invalid=await db.query<{n:string}>(`SELECT count(*)::text AS n
    FROM public.smn_ai_connection WHERE enabled=true OR credential_state<>'missing'
       OR last_test_status<>'never' OR last_test_at IS NOT NULL`);
   if(invalid.rows[0]?.n!=="0")throw Error("migration-ai-quarantine-invalid");
  }
  const after=await inspectPortableAiTransfer(db);
  if(before.connections!==after.connections||before.archives!==after.archives||
     before.responses!==after.responses)
   throw Error("migration-ai-transfer-count-changed");
  await db.query("COMMIT");
  return {connectionsNeedingKey:after.connections,archivesPreserved:after.archives,
   savedResponsesPreserved:after.responses,keysExported:false,readyForSending:false};
 }catch(error){
  await db.query("ROLLBACK").catch(()=>undefined);
  throw error;
 }
}
