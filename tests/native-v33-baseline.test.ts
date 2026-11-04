import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {
 NATIVE_V33_NAME,nativeV33BaselineSql,nativeV33BaselineReady,nativeV33HistoryValid
} from "../src/server/installation/native-v33";
import type {Snapshot} from "../src/server/installation/diagnostic";
import {validateExpressInput} from "../src/server/installation/contract";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const sql=nativeV33BaselineSql();

test("v33 native: one immutable complete schema, independent of the historical v32 SQL at runtime",()=>{
 assert.ok(sql);
 assert.equal(nativeV33BaselineReady(sql),true);
 for(const fragment of [
  read("prisma/baseline/v32/schema.sql").trimEnd(),
  "CREATE TABLE public.smn_indicator_definition",
  "CREATE TABLE IF NOT EXISTS public.smn_indicator_team_grant",
  "CREATE TABLE IF NOT EXISTS public.smn_indicator_dashboard_slot",
  "CREATE TABLE IF NOT EXISTS public.smn_dashboard_layout",
  "CREATE TABLE IF NOT EXISTS public.smn_dashboard_team_grant",
  "CHECK (palette IN ('ocean','forest','violet','red-purple'))"
 ]) assert.ok(sql.includes(fragment),"Missing consolidated DDL fragment");
 const installer=read("src/server/installation/install.ts");
 assert.match(installer,/nativeV33BaselineSql\(\)/);
 assert.doesNotMatch(installer,/from "\.\/native-v32"|indicatorV33Sql\(\)|paletteMigrationBody\(/);
 assert.equal(nativeV33BaselineReady(""),false);
 assert.equal(nativeV33BaselineReady(read("prisma/baseline/v32/schema.sql")),false);
});

test("v33 native: journal with exact checksum, structure and single migration is accepted",()=>{
 assert.ok(sql);
 const row={
  migration_name:NATIVE_V33_NAME,
  checksum:createHash("sha256").update(sql).digest("hex"),
  finished_at:new Date(),rolled_back_at:null
 };
 const snap={
  installations:[{id:"singleton",state:"initialized",schema_version:33}],
  migrations:[row],tableRead:true,migrationsRead:true,shapeValid:true,
  multiTeamSchemaValid:true,teamAgileModeSchemaValid:true,
  paletteSchemaValid:true,indicatorV33SchemaValid:true,
  tables:[
   "public.smn_indicator_team_grant:r","public.smn_indicator_dashboard_slot:r",
   "public.smn_indicator_definition:r","public.smn_indicator_manual_value:r",
   "public.smn_dashboard_layout:r","public.smn_dashboard_team_grant:r"
  ]
 } as unknown as Snapshot;
 assert.equal(nativeV33HistoryValid(snap,sql),true);
 assert.equal(nativeV33HistoryValid(snap,sql+"\n-- tampered"),false);
 assert.equal(nativeV33HistoryValid({...snap,migrations:[row,row]},sql),false);
 assert.equal(nativeV33HistoryValid({...snap,migrations:[{...row,checksum:"bad"}]},sql),false);
 assert.equal(nativeV33HistoryValid({...snap,indicatorV33SchemaValid:false},sql),false);
 assert.equal(nativeV33HistoryValid({...snap,teamAgileModeSchemaValid:false},sql),false);
 assert.equal(nativeV33HistoryValid({...snap,tables:snap.tables?.filter(t=>!t.includes("team_grant"))},sql),false);
 assert.equal(nativeV33HistoryValid({...snap,installations:[{id:"singleton",state:"initialized",schema_version:32}]},sql),false);
});

test("v33 native: installation does not write or upgrade the existing local database",()=>{
 const install=read("src/server/installation/install.ts");
 assert.match(install,/before\.status!=="virgin"/);
 assert.match(install,/objects\.rows\[0\]\?\.n!=="0"/);
 assert.match(install,/await client\.query\("ROLLBACK"\)/);
 assert.match(install,/await client\.query\("COMMIT"\)/);
 assert.match(install,/NATIVE_BASELINE_NAME/);
 const diagnostic=read("src/server/installation/diagnostic.ts");
 assert.match(diagnostic,/nativeV33HistoryValid\(snapshot,nativeV33BaselineSql\(\)\)/);
 assert.match(diagnostic,/nativeV32HistoryValid/,"legacy v33 install histories must remain readable");
});

test("v33 native: installation defaults to account-only setup without an Agile mode or team",()=>{
 const valid={adminUsername:"admin",adminEmail:"admin@example.test",password:"secure-test-password"};
 assert.deepEqual(validateExpressInput(valid),valid);
 assert.deepEqual(validateExpressInput({...valid,mode:"kanban",team:"Équipe test"}),valid);
 assert.equal(validateExpressInput({...valid,password:""}),null);
 const actual=nativeV33BaselineSql();
 assert.ok(actual);
 const install=actual.match(/CREATE TABLE "public"\."smn_installation" \(([\s\S]*?)\n\);/);
 assert.ok(install,"smn_installation declaration required");
 assert.doesNotMatch(install[1],/"mode"\s+"text"/);
 const team=actual.match(/CREATE TABLE "public"\."smn_team" \(([\s\S]*?)\n\);/);
 assert.ok(team,"smn_team declaration required");
 assert.match(team[1],/"agile_mode"\s+"text"/);
});
