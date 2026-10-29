import {createHash,randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
const NAME="20261029_smn_team_agile_mode_v32";
async function main(){
 if(process.argv.slice(2).join(" ")!=="--apply")throw Error("Usage: pnpm exec tsx scripts/apply-team-agile-mode-v32.ts --apply");
 const db=new Client({connectionString:await installedDatabaseUri(),connectionTimeoutMillis:3500,statement_timeout:30000});
 await db.connect();
 try{
  await db.query("BEGIN");
  try{
   await db.query("SELECT pg_advisory_xact_lock(20261029,32)");
   const state=await db.query<{schema_version:number;state:string}>("SELECT schema_version,state FROM public.smn_installation WHERE id='singleton' FOR UPDATE");
   if(state.rows.length!==1||state.rows[0].schema_version!==31||state.rows[0].state!=="initialized")throw Error("Base v31 initialisée requise");
   const history=await db.query<{n:string;done:string}>("SELECT count(*)::text n,count(*) FILTER(WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL)::text done FROM public._prisma_migrations");
   if(history.rows[0]?.n!=="31"||history.rows[0]?.done!=="31")throw Error("Journal de migrations v31 invalide");
   const existing=await db.query<{present:boolean}>("SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='smn_team' AND column_name='agile_mode') present");
   if(existing.rows[0]?.present)throw Error("Colonne déjà présente : migration refusée");
   const sql=readFileSync(new URL("../prisma/migrations/"+NAME+"/migration.sql",import.meta.url),"utf8");
   await db.query(sql);
   const verified=await db.query<{schema_version:number;invalid_modes:string;missing_columns:string}>(`
    SELECT i.schema_version,
     (SELECT count(*)::text FROM public.smn_team WHERE agile_mode NOT IN ('scrum','kanban')) AS invalid_modes,
     (SELECT (2-count(*))::text FROM information_schema.columns
       WHERE table_schema='public' AND table_name='smn_team'
        AND column_name IN ('agile_mode','is_archived') AND is_nullable='NO') AS missing_columns
    FROM public.smn_installation i WHERE i.id='singleton'`);
   if(verified.rows[0]?.schema_version!==32||verified.rows[0]?.invalid_modes!=="0"||
      verified.rows[0]?.missing_columns!=="0")throw Error("Validation du schéma v32 échouée : transaction annulée");
   await db.query("INSERT INTO public._prisma_migrations(id,checksum,finished_at,migration_name,applied_steps_count) VALUES($1,$2,now(),$3,1)",[randomUUID(),createHash("sha256").update(sql).digest("hex"),NAME]);
   await db.query("COMMIT");
  }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
 }finally{await db.end().catch(()=>undefined);}
 console.log("Migration v32 terminée : pnpm db:diagnose");
}
main().catch(error=>{console.error(error instanceof Error?error.message:"Erreur migration");process.exitCode=1;});
