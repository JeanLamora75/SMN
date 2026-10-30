/** Extract the v32 schema from an already validated development database. No database writes. */
import {spawnSync} from "node:child_process";
import {createHash} from "node:crypto";
import {existsSync,mkdirSync,readFileSync,renameSync,unlinkSync,writeFileSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {installedDatabaseUri} from "../src/server/auth/database";
import {probePostgres} from "../src/server/db/probe";
import {classifySnapshot} from "../src/server/installation/diagnostic";

export const BASELINE_PATH="prisma/baseline/v32/schema.sql";
export function assertBaselineSource(version:number|undefined,status:string,count:number,records:number){
 if(status!=="initialized"||version!==32||count!==32||records!==32)
  throw Error("Baseline refusée : base v32 saine et historique complet de 32 migrations requis");
}
export function verifyDump(sql:string){
 const needed=["CREATE TABLE","smn_installation","smn_team","smn_account","agile_mode","is_archived"];
 for(const marker of needed)if(!sql.includes(marker))throw Error("Dump incomplet : "+marker);
 if(/\b(?:INSERT INTO|COPY)\s+/.test(sql))throw Error("Dump contient des données : refus");
 return createHash("sha256").update(sql).digest("hex");
}
async function main(){
 if(process.argv.slice(2).join(" ")!=="--generate")throw Error("Usage: pnpm db:baseline:v32 --generate");
 const uri=await installedDatabaseUri();
 const snapshot=await probePostgres(uri);
 assertBaselineSource(snapshot.installations?.[0]?.schema_version,
  classifySnapshot(snapshot).status,
  snapshot.migrations?.length??0,
  snapshot.migrations?.filter(m=>m.finished_at&&!m.rolled_back_at).length??0);
 // pg_dump must be installed alongside PostgreSQL; can be set to a portable executable path.
 const bin=process.env.SMN_PG_DUMP_PATH||"pg_dump";
 // libpq does not interpret PGDATABASE as a connection URI here. Forward each
 // connection parameter explicitly, without leaking credentials in argv/logs.
 const connection=new URL(uri);
 const pgEnv:NodeJS.ProcessEnv={...process.env,
  PGHOST:decodeURIComponent(connection.hostname.replace(/^\\[|\\]$/g,"")),
  PGPORT:connection.port||"5432",
  PGDATABASE:decodeURIComponent(connection.pathname.slice(1)),
  PGUSER:decodeURIComponent(connection.username),
  PGPASSWORD:decodeURIComponent(connection.password)};
 const sslmode=connection.searchParams.get("sslmode");
 if(sslmode)pgEnv.PGSSLMODE=sslmode;
 const dump=spawnSync(bin,["--no-password","--schema-only","--no-owner","--no-privileges","--schema=public","--quote-all-identifiers"],
  {encoding:"utf8",env:pgEnv,maxBuffer:64*1024*1024,windowsHide:true});
 if(dump.error)throw Error("pg_dump inaccessible : "+dump.error.message);
 if(dump.status!==0)throw Error("pg_dump a échoué (code "+dump.status+") : "+dump.stderr.slice(0,500));
 const sql=dump.stdout;
 const hash=verifyDump(sql);
 const destination=resolve(BASELINE_PATH);
 mkdirSync(dirname(destination),{recursive:true});
 if(existsSync(destination)){
  const previous=readFileSync(destination,"utf8");
  if(previous!==sql)throw Error("Baseline existante différente : vérifier avant de remplacer "+BASELINE_PATH);
  console.log("Baseline identique : "+hash);return;
 }
 const temp=destination+".tmp";
 try{
  writeFileSync(temp,sql,{encoding:"utf8",flag:"wx"});
  renameSync(temp,destination);
 }catch(e){if(existsSync(temp))unlinkSync(temp);throw e;}
 console.log("Baseline v32 générée : "+BASELINE_PATH);
 console.log("SHA-256 : "+hash);
 console.log("Attention : SQL de structure uniquement, sans données initiales ni recette modules.");
}
if(process.argv[1]?.replaceAll("\\","/").endsWith("/generate-v32-baseline.ts"))
 main().catch(e=>{console.error(e instanceof Error?e.message:String(e));process.exitCode=1});
