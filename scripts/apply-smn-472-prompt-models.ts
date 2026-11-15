/**
 * Explicit, non-destructive migration of legacy brief templates to prompt_text.
 * CHECK is read-only; APPLY requires a separately verified backup.
 */
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {prepareLegacyBriefPrompt,type LegacyBriefModel} from "../src/lib/ai-brief-legacy-conversion";

type Row=LegacyBriefModel&{id:string;prompt_text?:string|null};

async function run(){
  const args=process.argv.slice(2);
  if(args.length!==1||!["--check","--apply"].includes(args[0]))throw Error("Usage: pnpm exec tsx scripts/apply-smn-472-prompt-models.ts --check|--apply");
  const apply=args[0]==="--apply";
  const db=new Client({connectionString:await installedDatabaseUri(),connectionTimeoutMillis:3500,statement_timeout:60000});
  await db.connect();
  try {
    const exists=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_ai_brief_template') IS NOT NULL AS present`);
    if(!exists.rows[0]?.present)throw Error("Table de modèles absente : initialiser la base SMN avant la migration.");
    const columns=await db.query<{column_name:string}>(`SELECT column_name FROM information_schema.columns
      WHERE table_schema='public' AND table_name='smn_ai_brief_template'`);
    const names=new Set(columns.rows.map(row=>row.column_name));
    const oldColumns=["sections","questions","instructions","data","depth"];
    const hasLegacy=oldColumns.every(name=>names.has(name));
    const hasPrompt=names.has("prompt_text");
    if(!hasLegacy){
      if(!hasPrompt)throw Error("Schéma inconnu : aucune colonne de prompt et contrat historique incomplet.");
      const state=await db.query<{missing:string}>(`SELECT count(*)::text AS missing FROM public.smn_ai_brief_template WHERE prompt_text IS NULL OR btrim(prompt_text)=''`);
      if(Number(state.rows[0]?.missing)>0)throw Error("Schéma moderne incomplet : des prompts sont vides.");
      console.log("Schéma texte libre détecté, aucune conversion historique nécessaire.");
      return;
    }
    if(apply&&process.env.SMN_BRIEF_BACKUP_VERIFIED!=="YES")throw Error("Sauvegarde SMN vérifiée obligatoire avant --apply : SMN_BRIEF_BACKUP_VERIFIED=YES.");
    await db.query("BEGIN");
    try {
      if(apply)await db.query("LOCK TABLE public.smn_ai_brief_template IN SHARE ROW EXCLUSIVE MODE");
      const selection=hasPrompt?"id::text, title, sections, questions, instructions, data, depth, prompt_text":"id::text, title, sections, questions, instructions, data, depth";
      const result=await db.query<Row>(`SELECT ${selection} FROM public.smn_ai_brief_template ORDER BY id`);
      const updates: {id:string;prompt:string}[]=[];
      const unresolved: {id:string;fields:string[]}[]=[];
      for(const row of result.rows){
        if(hasPrompt&&row.prompt_text?.trim())continue;
        const converted=prepareLegacyBriefPrompt(row);
        if(converted.unresolvedFields.length)unresolved.push({id:row.id,fields:converted.unresolvedFields});
        if(!converted.promptText.trim())unresolved.push({id:row.id,fields:["prompt-vide"]});
        updates.push({id:row.id,prompt:converted.promptText});
      }
      const report={mode:apply?"apply":"check",templates:result.rows.length,toConvert:updates.length,unresolved};
      console.log(JSON.stringify(report,null,2));
      if(unresolved.length)throw Error("Conversion incomplète : établir les correspondances des champs listés avant toute modification.");
      if(apply){
        if(!hasPrompt)await db.query("ALTER TABLE public.smn_ai_brief_template ADD COLUMN prompt_text text");
        for(const row of updates)await db.query("UPDATE public.smn_ai_brief_template SET prompt_text=$2 WHERE id=$1",[row.id,row.prompt]);
        const counts=await db.query<{missing:string}>(`SELECT count(*)::text AS missing FROM public.smn_ai_brief_template WHERE prompt_text IS NULL OR btrim(prompt_text)=''`);
        if(Number(counts.rows[0]?.missing)>0)throw Error("Backfill incomplet : rollback.");
        await db.query("COMMIT");
      }else await db.query("ROLLBACK");
    }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
  }finally{await db.end();}
}
run().catch(error=>{console.error(error instanceof Error?error.message:String(error));process.exitCode=1;});
