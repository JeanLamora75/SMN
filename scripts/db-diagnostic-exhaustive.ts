/** Audit en lecture seule : historique, empreintes SQL, structures et cohérence v32. */
import {readdirSync} from "node:fs";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {probePostgres} from "../src/server/db/probe";
import {classifySnapshot} from "../src/server/installation/diagnostic";
import {INSTALLATION_RELATIONS} from "../src/server/installation/contract";
import {checkRecordedMigrationJournal} from "./db-recorded-history";
import {NATIVE_V32_NAME,nativeBaselineSql} from "../src/server/installation/native-v32";

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
 // Les migrations Prisma de ce dépôt ne sont pas toutes l'artefact SQL exact
 // inscrit dans le journal historique (certaines proviennent de chaînes TS).
 // Ne jamais inventer une divergence d'empreinte en comparant ces deux sources.
 const native=migrations.length===1&&migrations[0]?.migration_name===NATIVE_V32_NAME;
 if(native&&!nativeBaselineSql())errors.push("Baseline native v32 absente ou invalide");
 errors.push(...checkRecordedMigrationJournal(migrations,native?1:version));
 const warnings=["Empreintes historiques non auditées à partir des fichiers prisma/migrations : source non canonique. Le diagnostic standard vérifie ses migrations de référence."];
 const unexpected=snapshot.tables.filter(t=>!INSTALLATION_RELATIONS.includes(t as typeof INSTALLATION_RELATIONS[number]));
 if(unexpected.length)errors.push("Objets non prévus : "+unexpected.join(", "));
 const contracts=Object.entries(snapshot).filter(([key])=>key.endsWith("SchemaValid"));
 for(const [name,ok] of contracts)if(ok!==true)errors.push("Contrat non satisfait : "+name);
 if(contracts.length<20)errors.push("Audit incomplet : seuls "+contracts.length+" contrats ont été sondés");
 if(snapshot.shapeValid!==true)errors.push("Structure initiale invalide");
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
 console.log(JSON.stringify({status,version,migrationCount:migrations.length,sourceCount:directories.length,warnings,
  unexpectedRelations:unexpected,errors,ok:errors.length===0},null,2));
 if(errors.length)process.exitCode=1;
}
main().catch(e=>{console.error(e instanceof Error?e.message:String(e));process.exitCode=1});
