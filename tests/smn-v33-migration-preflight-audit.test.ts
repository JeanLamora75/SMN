import test from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {readFileSync} from "node:fs";
import {applyV33} from "../scripts/apply-smn-338-v33";
import {decideUpgrade} from "../scripts/db-upgrade-policy";
import {evaluateSchemaCapability,CURRENT_SCHEMA_VERSION} from "../src/server/schema/compatibility";

type Config={version:number;state?:string;count?:number;done?:number;relations?:string[]};
function fakeDb(config:Config){
 const statements:string[]=[];
 const db={query:async(sql:string)=>{
  statements.push(sql);
  if(sql.startsWith("SELECT schema_version,state"))return {rows:[{schema_version:config.version,state:config.state??"initialized"}]};
  if(sql.startsWith("SELECT count(*)::text"))return {rows:[{n:String(config.count??32),done:String(config.done??32)}]};
  if(sql.startsWith("SELECT relname FROM pg_class"))return {rows:(config.relations??["smn_team","smn_account","smn_sprint","smn_kanban_period"]).map(relname=>({relname}))};
  if(sql==="BEGIN TRANSACTION READ ONLY"||sql==="ROLLBACK")return {rows:[]};
  throw Error("Unexpected SQL in non-mutating preflight: "+sql);
 }} as unknown as Client;
 return {db,statements};
}
test("v33 migration preflight is read-only and requires healthy v32 with complete journal",async()=>{
 const ok=fakeDb({version:32});
 const result=await applyV33(ok.db,false);
 assert.equal(result.ready,true);
 assert.equal(result.applied,false);
 assert.equal(result.version,32);
 assert.equal(ok.statements[0],"BEGIN TRANSACTION READ ONLY");
 assert.equal(ok.statements.at(-1),"ROLLBACK");
 assert.ok(ok.statements.every(q=>!/^\s*(?:INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i.test(q)));
 for(const config of [
  {version:33},{version:31},{version:32,state:"incomplete"},
  {version:32,count:31,done:31},{version:32,count:32,done:31},
  {version:32,relations:["smn_team","smn_account","smn_sprint"]}
 ]){
  const f=fakeDb(config);
  await assert.rejects(applyV33(f.db,false),/requise|incompatible|manquantes/);
  assert.equal(f.statements.at(-1),"ROLLBACK");
 }
});
test("upgrade decision rejects incomplete journals and unknown versions",()=>{
 for(const [version,count] of [[32,31],[32,2],[33,32],[34,35]] as const)
  assert.equal(decideUpgrade("initialized",version,count).kind,"refuse");
 for(const [version,count] of [[32,1],[32,32],[33,1],[33,2],[33,33]] as const)
  assert.equal(decideUpgrade("initialized",version,count).kind,"noop");
 assert.equal(decideUpgrade("installation-incomplete",33,33).kind,"refuse");
});
test("capabilities recognize exactly v33 and fail closed for future versions",()=>{
 assert.equal(CURRENT_SCHEMA_VERSION,33);
 for(const capability of ["multi-team","per-team-agile-mode","company-catalog","links","country-consolidation"] as const){
  assert.equal(evaluateSchemaCapability(33,capability).ok,true);
  assert.equal(evaluateSchemaCapability(34,capability).ok,false);
 }
});

test("standalone migration CLI must inspect full schema and checksums before connecting to write",()=>{
 const cli=readFileSync(new URL("../scripts/apply-smn-338-v33.ts",import.meta.url),"utf8");
 assert.match(cli,/classifySnapshot\(snapshot\)\.status!=="initialized"/);
 assert.match(cli,/probePostgres\(uri\)/);
 assert.match(cli,/snapshot\.installations\?\.\[0\]\?\.schema_version!==32/);
 assert.match(cli,/SMN_V33_BACKUP_VERIFIED/);
});
