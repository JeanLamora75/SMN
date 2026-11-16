/** Explicit, backup-gated cleanup of obsolete brief model columns. */
import {Client} from "pg";
import {readFileSync} from "node:fs";
import {installedDatabaseUri} from "../src/server/auth/database";

const obsolete=["sections","questions","instructions","data","depth"] as const;
type CatalogColumn={column_name:string};
type Stats={templates:number;missing:number;archives:number;columns:string[];templateDigest:string;archiveDigest:string};

export async function inspectBriefCleanup(db:Client):Promise<Stats>{
 const tables=await db.query<{model:string|null;archive:string|null}>(`
  SELECT to_regclass('public.smn_ai_brief_template')::text AS model,
         to_regclass('public.smn_ai_brief_archive')::text AS archive`);
 if(!tables.rows[0]?.model||!tables.rows[0]?.archive)
  throw Error("smn-477: tables modèle/archive absentes");
 const columns=await db.query<CatalogColumn>(`
  SELECT column_name FROM information_schema.columns
  WHERE table_schema='public' AND table_name='smn_ai_brief_template'`);
 const names=columns.rows.map(x=>x.column_name);
 if(!names.includes("prompt_text"))throw Error("smn-477: backfill prompt_text absent");
 const counts=await db.query<{templates:string;missing:string}>(`
  SELECT count(*)::text AS templates, count(*) FILTER(
  WHERE prompt_text IS NULL OR btrim(prompt_text)='' OR length(prompt_text)>100000
  )::text AS missing FROM public.smn_ai_brief_template`);
 const templatesDigest=await db.query<{digest:string}>(`
  SELECT md5(coalesce(string_agg(id::text||':'||revision::text,'|' ORDER BY id),'')) AS digest
  FROM public.smn_ai_brief_template`);
 const archives=await db.query<{n:string;digest:string}>(`
  SELECT count(*)::text AS n,
   md5(coalesce(string_agg(id::text||':'||template_id||':'||
   template_revision::text||':'||sha256,'|' ORDER BY id),'')) AS digest
  FROM public.smn_ai_brief_archive`);
 return {
  templates:Number(counts.rows[0]?.templates??0),
  missing:Number(counts.rows[0]?.missing??0),
  archives:Number(archives.rows[0]?.n??0),
  archiveDigest:archives.rows[0]?.digest??"",
  templateDigest:templatesDigest.rows[0]?.digest??"",
  columns:names.filter(x=>obsolete.some(v=>v===x))
 };
}
export async function applyBriefCleanup(db:Client,apply:boolean){
 await db.query("BEGIN");
 try{
  await db.query("SELECT pg_advisory_xact_lock(20261116,477)");
  const before=await inspectBriefCleanup(db);
  if(before.missing)throw Error("smn-477: backfill non terminé, suppression refusée");
  if(!apply){await db.query("ROLLBACK");return {applied:false,before};}
  const sql=readFileSync(new URL("../prisma/migrations/20261116_smn477_brief_legacy_cleanup/migration.sql",import.meta.url),"utf8");
  await db.query(sql);
  const after=await inspectBriefCleanup(db);
  if(after.columns.length||after.archives!==before.archives||after.templates!==before.templates||
   after.archiveDigest!==before.archiveDigest||after.templateDigest!==before.templateDigest||after.missing!==0)
   throw Error("smn-477: preuve d'équivalence du schéma et des volumes refusée");
  await db.query("COMMIT");
  return {applied:true,before,after};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
async function main(){
 const args=process.argv.slice(2);
 if(args.length!==1||!["--check","--apply"].includes(args[0]))
  throw Error("Usage: pnpm db:cleanup:smn-477 --check|--apply");
 const apply=args[0]==="--apply";
 if(apply&&(process.env.SMN_AI_BRIEF_BACKUP_VERIFIED!=="YES"||
            process.env.SMN_AI_BRIEF_RESTORE_REHEARSAL_VERIFIED!=="YES"))
  throw Error("smn-477: sauvegarde et restauration isolée vérifiées obligatoires");
 const db=new Client({connectionString:await installedDatabaseUri(),connectionTimeoutMillis:3500,statement_timeout:60000});
 await db.connect();
 try{console.log(JSON.stringify(await applyBriefCleanup(db,apply),null,2));}
 finally{await db.end();}
}
if(process.argv[1]?.replace(/\\/g,"/").endsWith("/apply-smn-477-brief-cleanup.ts"))
 main().catch(e=>{console.error(e instanceof Error?e.message:String(e));process.exitCode=1;});
