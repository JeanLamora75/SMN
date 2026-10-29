/** Audit en lecture seule : historique, empreintes SQL, structures et cohérence v32. */
import {createHash} from "node:crypto";
import {readFileSync,readdirSync} from "node:fs";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {probePostgres} from "../src/server/db/probe";
import {classifySnapshot} from "../src/server/installation/diagnostic";
import {INSTALLATION_RELATIONS} from "../src/server/installation/contract";

export function verifyHistory(rows:readonly {migration_name:string;checksum?:string;finished_at:Date|null;rolled_back_at:Date|null}[],
 sources:ReadonlyMap<string,string>):string[]{
 const errors:string[]=[];
 const names=new Set<string>();
 for(const row of rows){
  if(names.has(row.migration_name))errors.push("Migration en double : "+row.migration_name);
  names.add(row.migration_name);
  if(!row.finished_at||row.rolled_back_at)errors.push("Migration non terminée : "+row.migration_name);
  const sql=sources.get(row.migration_name);
  if(sql===undefined)errors.push("SQL source introuvable : "+row.migration_name);
  else if(createHash("sha256").update(sql).digest("hex")!==row.checksum)
   errors.push("Checksum divergent : "+row.migration_name);
 }
 for(const name of sources.keys())if(!names.has(name))errors.push("Migration non appliquée : "+name);
 return errors;
}
async function main(){
 if(process.argv.length!==2)throw Error("Usage : pnpm db:diagnose:full");
 const uri=await installedDatabaseUri();
 const snapshot=await probePostgres(uri);
 const errors:string[]=[];
 const status=classifySnapshot(snapshot).status;
 if(status!=="initialized")errors.push("État installation : "+status);
 const version=snapshot.installations?.[0]?.schema_version;
 if(version!==32)errors.push("Version attendue : 32 ; obtenue : "+String(version));
 const migrations=snapshot.migrations??[];
 const directories=readdirSync("prisma/migrations",{withFileTypes:true})
   .filter(d=>d.isDirectory()).map(d=>d.name).sort();
 const sources=new Map<string,string>();
 for(const name of directories){
  try{sources.set(name,readFileSync("prisma/migrations/"+name+"/migration.sql","utf8"))}
  catch{errors.push("SQL absent : "+name)}
 }
 errors.push(...verifyHistory(migrations,sources));
 if(migrations.length!==version)errors.push("Journal et version différents");
 const unexpected=snapshot.tables.filter(t=>!INSTALLATION_RELATIONS.includes(t as typeof INSTALLATION_RELATIONS[number]));
 if(unexpected.length)errors.push("Objets non prévus : "+unexpected.join(", "));
 for(const [label,ok] of Object.entries({
  "Structure initiale":snapshot.shapeValid,
  "Multi-équipes":snapshot.multiTeamSchemaValid,
  "Liens":snapshot.linksSchemaValid,
  "Pays":snapshot.countryConsolidationSchemaValid,
  "Entreprises":snapshot.companySchemaValid,
  "Mode Agile v32":snapshot.teamAgileModeSchemaValid,
  "Absences":snapshot.absencesSchemaValid,
  "Capacités":snapshot.capacitySchemaValid,
  "Capacité réelle":snapshot.capacityActualSchemaValid,
  "Replanification":snapshot.capacityReplanningSchemaValid
 }))if(ok!==true)errors.push("Contrat non satisfait : "+label);
 const db=new Client({connectionString:uri,connectionTimeoutMillis:3500,statement_timeout:10000,
  application_name:"smn-v32-full-diagnostic-readonly"});
 await db.connect();
 try{
  await db.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
  const result=await db.query<{bad_mode:string;null_mode:string}>(`
   SELECT count(*) FILTER(WHERE agile_mode NOT IN ('scrum','kanban'))::text AS bad_mode,
          count(*) FILTER(WHERE agile_mode IS NULL)::text AS null_mode
   FROM public.smn_team`);
  if(result.rows[0]?.bad_mode!=="0"||result.rows[0]?.null_mode!=="0")
   errors.push("Données smn_team.agile_mode incohérentes");
  await db.query("ROLLBACK");
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);errors.push("Contrôle SQL : "+String(e))}
 finally{await db.end().catch(()=>undefined)}
 console.log(JSON.stringify({status,version,migrationCount:migrations.length,sourceCount:sources.size,
  unexpectedRelations:unexpected,errors,ok:errors.length===0},null,2));
 if(errors.length)process.exitCode=1;
}
main().catch(e=>{console.error(e instanceof Error?e.message:String(e));process.exitCode=1});
