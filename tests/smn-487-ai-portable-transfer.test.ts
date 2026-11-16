import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,mkdir,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {readFileSync} from "node:fs";
import type {Client} from "pg";
import {inspectPortableAiTransfer,assertPortableDestinationVaultEmpty,
 quarantineRestoredAiConnections} from "../src/server/backup/portable-ai-connections";

const connections=["id","installation_id","label","provider_id","model_id","enabled",
 "credential_state","last_test_status","last_test_at","revision",
 "created_by","created_at","updated_at"];
const responses=["id","archive_id","team_id","author_id","response_text","provider","model",
 "created_at","updated_at","human_edited","deleted_at"];
type Connection={id:string;revision:number;enabled:boolean;credential_state:string;
 last_test_status:string;last_test_at:string|null};
function fakeDb(opts:{secretColumn?:boolean;legacy?:boolean;changeCounts?:boolean}={}){
 const rows:Connection[]=[{id:"00000000-0000-4000-8000-000000000001",revision:8,
  enabled:true,credential_state:"configured",last_test_status:"passed",
  last_test_at:"2026-11-16"}];
 const archiveCount=3,responseCount=2;
 let committed=false,rolledBack=false,updates=0;
 const db={query:async(sql:string,params:unknown[]=[])=>{
  if(sql==="BEGIN")return {rows:[],rowCount:0};
  if(sql==="COMMIT"){committed=true;return {rows:[],rowCount:0};}
  if(sql==="ROLLBACK"){rolledBack=true;return {rows:[],rowCount:0};}
  if(sql.startsWith("SELECT to_regclass($1)")){
   const name=String(params[0]);
   return {rows:[{exists:opts.legacy?name!=="public.smn_ai_connection":
    ["public.smn_ai_connection","public.smn_ai_brief_archive",
     "public.smn_ai_brief_response"].includes(name)}]};
  }
  if(sql.includes("information_schema.columns")){
   const name=String(params[0]);
   return {rows:(name==="smn_ai_connection"?
    [...connections,...(opts.secretColumn?["api_key"]:[])]:responses).map(column_name=>({column_name}))};
  }
  if(sql.includes("UPDATE public.smn_ai_connection")){
   updates++;
   for(const row of rows){
    row.enabled=false;row.credential_state="missing";row.last_test_status="never";
    row.last_test_at=null;
   }
   return {rows:[],rowCount:1};
  }
  if(sql.includes("FROM public.smn_ai_connection WHERE enabled=true"))
   return {rows:[{n:String(rows.filter(r=>r.enabled||r.credential_state!=="missing"||
    r.last_test_status!=="never"||r.last_test_at!==null).length)}]};
  if(sql.includes("SELECT count(*)::text AS n FROM public.smn_ai_connection"))
   return {rows:[{n:opts.changeCounts&&updates?String(rows.length+1):String(rows.length)}]};
  if(sql.includes("SELECT count(*)::text AS n FROM public.smn_ai_brief_archive"))
   return {rows:[{n:String(archiveCount)}]};
  if(sql.includes("SELECT count(*)::text AS n FROM public.smn_ai_brief_response"))
   return {rows:[{n:String(responseCount)}]};
  throw Error("Unexpected SQL: "+sql);
 }} as unknown as Client;
 return {db,rows,summary:()=>({committed,rolledBack,updates})};
}
test("SMN-487 preserves connection IDs/revisions, TXT archives and intentionally saved responses",async()=>{
 const {db,rows,summary}=fakeDb();
 const before=await inspectPortableAiTransfer(db);
 assert.deepEqual(before,{hasConnections:true,connections:1,archives:3,responses:2});
 const original=rows[0].id,revision=rows[0].revision;
 const result=await quarantineRestoredAiConnections(db);
 assert.deepEqual(result,{connectionsNeedingKey:1,archivesPreserved:3,
  savedResponsesPreserved:2,keysExported:false,readyForSending:false});
 assert.equal(rows[0].id,original);assert.equal(rows[0].revision,revision);
 assert.equal(rows[0].enabled,false);assert.equal(rows[0].credential_state,"missing");
 assert.equal(rows[0].last_test_status,"never");assert.equal(rows[0].last_test_at,null);
 assert.equal(summary().committed,true);
});
test("SMN-487 unknown credential columns are rejected before dumping or restoring",async()=>{
 const {db,summary}=fakeDb({secretColumn:true});
 await assert.rejects(inspectPortableAiTransfer(db),/migration-ai-schema-untrusted/);
 await assert.rejects(quarantineRestoredAiConnections(db),/migration-ai-schema-untrusted/);
 assert.equal(summary().committed,false);assert.equal(summary().rolledBack,true);
});
test("SMN-487 imported archives must be count-identical or transaction is rolled back",async()=>{
 const {db,summary}=fakeDb({changeCounts:true});
 await assert.rejects(quarantineRestoredAiConnections(db),/migration-ai-transfer-count-changed/);
 assert.equal(summary().committed,false);assert.equal(summary().rolledBack,true);
});
test("SMN-487 older installations without connection table keep a safe empty inventory",async()=>{
 const {db}=fakeDb({legacy:true});
 const report=await quarantineRestoredAiConnections(db);
 assert.equal(report.connectionsNeedingKey,0);
 assert.equal(report.readyForSending,false);
});
test("SMN-487 destination vault guard refuses foreign keys without deleting them",async()=>{
 const root=await mkdtemp(join(tmpdir(),"smn487-test-"));
 try{
  await mkdir(join(root,"data","ai-secrets"),{recursive:true});
  await assert.doesNotReject(assertPortableDestinationVaultEmpty(root));
  const secret=join(root,"data","ai-secrets",".vault-master-v1");
  await writeFile(secret,Buffer.alloc(32,41));
  await assert.rejects(assertPortableDestinationVaultEmpty(root),/migration-ai-vault-not-empty/);
  const contents=readFileSync(secret);
  assert.equal(contents.length,32);
 }finally{await rm(root,{recursive:true,force:true});}
});
test("SMN-487 ZIP, database, sandbox and offline promotion all honor privacy guards",()=>{
 const read=(p:string)=>readFileSync(p,"utf8");
 const zip=read("src/server/backup/portable-transfer-zip.ts");
 const tar=read("src/server/backup/portable-package.ts");
 const importFile=read("src/server/backup/portable-import.ts");
 const runner=read("src/server/backup/runner.ts");
 const sandbox=read("src/server/backup/restore-sandbox.ts");
 const cutover=read("src/server/backup/fresh-install-cutover.ts");
 const gui=read("scripts/smn-gui-offline-restore.ts");
 const policy=read("src/server/backup/portable-ai-connections.ts");
 for(const s of [zip,tar,importFile]){
  assert.doesNotMatch(s,/ai-secrets|vault-master-v1/);
 }
 assert.match(runner,/inspectPortableAiTransfer\(client\)/);
 assert.match(runner,/backup-ai-vault-overlap/);
 assert.match(sandbox,/inspectPortableAiTransfer\(sandbox\)/);
 assert.match(cutover,/assertPortableDestinationVaultEmpty\(\)/);
 assert.match(cutover,/quarantineRestoredAiConnections\(target\)/);
 assert.ok(cutover.indexOf("const verdict=comparePortableCurrentState")<
  cutover.indexOf("await quarantineRestoredAiConnections(target)"));
 assert.ok(cutover.indexOf("await quarantineRestoredAiConnections(target)")<
  cutover.indexOf("ALTER DATABASE"));
 assert.match(cutover,/migration-erasure-window-unqualified/);
 assert.match(cutover,/rollbackFiles\(\)/);
 assert.match(gui,/activateFreshManagedInstallation/);
 assert.match(gui,/rollbackVerifiedNewComputerCutover/);
 assert.match(policy,/SET enabled=false,credential_state='missing'/);
 assert.doesNotMatch(policy,/DELETE FROM public\.smn_ai_brief_archive|UPDATE public\.smn_ai_brief_response/);
});
