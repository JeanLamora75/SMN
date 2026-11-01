import {inventoryRetiredCandidates} from "./smn-351-candidate-inventory";
import {loadProof,sourceFingerprint} from "./smn-351-proof-record";
import {Client} from 'pg';
import {installedDatabaseUri} from '../src/server/auth/database';
import {auditLegacyIndicators} from './smn-351-legacy-audit';
import {auditApplicationDependencies} from './smn-351-app-dependencies';
async function main(){
 if(process.argv.slice(2).join(' ')!=='--check')throw Error('Read-only --check required');
 const uri=await installedDatabaseUri();
 const db=new Client({connectionString:uri,connectionTimeoutMillis:3500});
 await db.connect();
 try{
  await db.query('BEGIN READ ONLY');
  const result=await auditLegacyIndicators(db);
  const candidateData=await inventoryRetiredCandidates(db);
  await db.query('COMMIT');
  const application=auditApplicationDependencies();
  const blocking:string[]=[];
  if(result.schemaVersion!==33)blocking.push('schema-not-v33');
  if(result.unknown.length)blocking.push('unclassified-business-objects');
  if(result.unsafeCandidates.length)blocking.push('sql-dependencies');
  const proof=loadProof(sourceFingerprint(uri));
  if(!proof)blocking.push('fresh-vs-migrated-schema-comparison-not-verified');
  if(application.runtimeBlockers.length)blocking.push('active-application-references-to-legacy-tables');
  if(!proof)blocking.push('historical-v32-upgrade-restoration-not-verified');
  if(candidateData.some(c=>c.exists&&c.rows!=="0"))blocking.push('candidate-data-present-requires-reviewed-backup');
  // Proofs are readiness information, never authority to run DROP.
  blocking.push('destructive-cutover-not-authorized');
  console.log(JSON.stringify({authorized:false,destructiveOperationExecuted:false,blocking,proofs:proof?{comparison:proof.comparison,restoration:proof.restoration,createdAt:proof.createdAt}:null,candidateData,application,inventory:result},null,2));
  process.exitCode=2;
 }catch(e){await db.query('ROLLBACK').catch(()=>undefined);throw e;}finally{await db.end();}
}
if(process.argv[1]?.replaceAll(String.fromCharCode(92),'/').endsWith('/smn-351-cleanup-preflight.ts'))main().catch(e=>{console.error(e);process.exitCode=1});
