/**
 * Explicit, loss-aware migration of legacy brief templates to prompt_text.
 * Check is read-only. The CLI refuses writes without a separately verified backup.
 */
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {prepareLegacyBriefPrompt,type LegacyBriefModel} from "../src/lib/ai-brief-legacy-conversion";

type Row=LegacyBriefModel&{id:string;prompt_text?:string|null};
export type PromptMigrationReport={
  mode:"check"|"apply";
  templates:number;
  toConvert:number;
  unresolved:{id:string;fields:string[]}[];
};

export async function migrateBriefModels(db:Client,apply:boolean):Promise<PromptMigrationReport>{
  const exists=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_ai_brief_template') IS NOT NULL AS present`);
  if(!exists.rows[0]?.present)throw Error("Table de modèles absente : initialiser la base SMN avant la migration.");
  const columns=await db.query<{column_name:string}>(`SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name='smn_ai_brief_template'`);
  const names=new Set(columns.rows.map(row=>row.column_name));
  const hasLegacy=["sections","questions","instructions","data","depth"].every(name=>names.has(name));
  const hasPrompt=names.has("prompt_text");
  if(!hasLegacy){
    if(!hasPrompt)throw Error("Schéma inconnu : aucun contrat historique complet ni champ prompt_text.");
    const result=await db.query<{missing:string;total:string}>(`SELECT count(*) FILTER(WHERE prompt_text IS NULL OR btrim(prompt_text)='')::text AS missing,
      count(*)::text AS total FROM public.smn_ai_brief_template`);
    if(Number(result.rows[0]?.missing)>0)throw Error("Schéma moderne incomplet : des prompts sont vides.");
    return {mode:apply?"apply":"check",templates:Number(result.rows[0]?.total),toConvert:0,unresolved:[]};
  }
  await db.query(apply?"BEGIN":"BEGIN READ ONLY");
  try {
    if(apply){
      await db.query("SELECT pg_advisory_xact_lock(20261115,472)");
      await db.query("LOCK TABLE public.smn_ai_brief_template IN SHARE ROW EXCLUSIVE MODE");
    }
    const selection=hasPrompt?
      "id::text,title,sections,questions,instructions,data,depth,prompt_text":
      "id::text,title,sections,questions,instructions,data,depth";
    const result=await db.query<Row>(`SELECT ${selection} FROM public.smn_ai_brief_template ORDER BY id`);
    const updates:{id:string;prompt:string}[]=[];
    const unresolved:PromptMigrationReport["unresolved"]=[];
    for(const row of result.rows){
      if(hasPrompt&&row.prompt_text?.trim())continue;
      const converted=prepareLegacyBriefPrompt(row);
      if(converted.unresolvedFields.length)unresolved.push({id:row.id,fields:converted.unresolvedFields});
      if(!converted.promptText.trim())unresolved.push({id:row.id,fields:["prompt-vide"]});
      updates.push({id:row.id,prompt:converted.promptText});
    }
    const report:PromptMigrationReport={mode:apply?"apply":"check",templates:result.rows.length,toConvert:updates.length,unresolved};
    if(unresolved.length)throw Error("Conversion incomplète : "+JSON.stringify(unresolved));
    if(apply){
      if(!hasPrompt)await db.query("ALTER TABLE public.smn_ai_brief_template ADD COLUMN prompt_text text");
      for(const row of updates)await db.query("UPDATE public.smn_ai_brief_template SET prompt_text=$2 WHERE id=$1",[row.id,row.prompt]);
      const missing=await db.query<{n:string}>(`SELECT count(*)::text AS n FROM public.smn_ai_brief_template
        WHERE prompt_text IS NULL OR btrim(prompt_text)=''`);
      if(Number(missing.rows[0]?.n)>0)throw Error("Backfill incomplet : rollback.");
      await db.query("COMMIT");
    }else await db.query("ROLLBACK");
    return report;
  }catch(error){
    await db.query("ROLLBACK").catch(()=>undefined);
    throw error;
  }
}

async function main(){
  const args=process.argv.slice(2);
  if(args.length!==1||!["--check","--apply"].includes(args[0]))
    throw Error("Usage: pnpm exec tsx scripts/apply-smn-472-prompt-models.ts --check|--apply");
  const apply=args[0]==="--apply";
  if(apply&&process.env.SMN_BRIEF_BACKUP_VERIFIED!=="YES")
    throw Error("Sauvegarde vérifiée obligatoire avant --apply : SMN_BRIEF_BACKUP_VERIFIED=YES.");
  const db=new Client({connectionString:await installedDatabaseUri(),connectionTimeoutMillis:3500,statement_timeout:60000});
  await db.connect();
  try{console.log(JSON.stringify(await migrateBriefModels(db,apply),null,2));}
  finally{await db.end();}
}
if(/apply-smn-472-prompt-models\.(?:ts|mjs)$/.test(process.argv[1]?.replaceAll("\\","/")??""))
  main().catch(error=>{console.error(error instanceof Error?error.message:String(error));process.exitCode=1;});
