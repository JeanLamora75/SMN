import {Client} from 'pg';
import {installedDatabaseUri} from '../src/server/auth/database';
import {auditLegacyIndicators} from './smn-351-legacy-audit';
import {auditApplicationDependencies} from './smn-351-app-dependencies';
async function main(){
 if(process.argv.slice(2).join(' ')!=='--check')throw Error('Read-only --check required');
 const db=new Client({connectionString:await installedDatabaseUri(),connectionTimeoutMillis:3500});
 await db.connect();
 try{
  await db.query('BEGIN READ ONLY');
  const result=await auditLegacyIndicators(db);
  await db.query('COMMIT');
  const application=auditApplicationDependencies();
  const blocking:string[]=[];
  if(result.schemaVersion!==33)blocking.push('schema-not-v33');
  if(result.unknown.length)blocking.push('unclassified-business-objects');
  if(result.unsafeCandidates.length)blocking.push('sql-dependencies');
  blocking.push('fresh-vs-migrated-schema-comparison-not-verified');
  if(application.runtimeBlockers.length)blocking.push('active-application-references-to-legacy-tables');
  blocking.push('historical-v32-upgrade-restoration-not-verified');
  console.log(JSON.stringify({authorized:false,destructiveOperationExecuted:false,blocking,application,inventory:result},null,2));
  process.exitCode=2;
 }catch(e){await db.query('ROLLBACK').catch(()=>undefined);throw e;}finally{await db.end();}
}
if(process.argv[1]?.replaceAll(String.fromCharCode(92),'/').endsWith('/smn-351-cleanup-preflight.ts'))main().catch(e=>{console.error(e);process.exitCode=1});
