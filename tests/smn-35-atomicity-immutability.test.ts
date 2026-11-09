import assert from "node:assert/strict";
import {describe,it} from "node:test";
import type {Client} from "pg";
import {withAtomicBusinessUnit,atomicAbort,atomicCommit} from "../src/server/backup/atomic-unit";
import {updateBackupRetention} from "../src/server/backup/retention";
import {SMN35_ARCHIVE_IMMUTABILITY_SQL,SMN35_ARCHIVE_GUARD_CHECK_SQL}
 from "../src/server/backup/archive-immutability";

function simulatedDb(fault:"none"|"audit"|"business"="none"){
 let working={days:30,revision:2},committed={...working};
 let inTransaction=false;const events:string[]=[];
 const db={query:async(sql:string,values:unknown[]=[])=>{
  events.push(sql);
  if(sql==="BEGIN"){inTransaction=true;working={...committed};return {rowCount:0,rows:[]};}
  if(sql==="ROLLBACK"){inTransaction=false;working={...committed};return {rowCount:0,rows:[]};}
  if(sql==="COMMIT"){committed={...working};inTransaction=false;return {rowCount:0,rows:[]};}
  if(sql.includes("SELECT pg_advisory_xact_lock"))return {rowCount:1,rows:[]};
  if(sql.includes("SELECT days,revision"))return {
   rowCount:1,rows:[{...working,updated_at:new Date("2026-11-09T00:00:00.000Z")}]
  };
  if(sql.includes("UPDATE public.smn_backup_retention")){
   if(fault==="business")throw Error("artificial-business-failure");
   working={days:values[0] as number,revision:working.revision+1};
   return {rowCount:1,rows:[{...working,updated_at:new Date("2026-11-09T00:00:00.000Z")}]};
  }
  if(sql.includes("INSERT INTO public.smn_backup_retention_audit")){
   if(fault==="audit")throw Error("artificial-audit-failure");
   return {rowCount:1,rows:[]};
  }
  throw new Error("unexpected SQL: "+sql);
 }} as unknown as Client;
 return {db,events,state:()=>({...committed}),open:()=>inTransaction};
}

describe("SMN-35 — unité métier atomique audit + données",()=>{
 it("valide seulement après insertion du journal d'audit",async()=>{
  const f=simulatedDb();
  const result=await updateBackupRetention(f.db,"admin-1",{days:45,revision:2});
  assert.equal(result.ok,true);
  assert.deepEqual(f.state(),{days:45,revision:3});
  assert.ok(f.events.findIndex(x=>x.includes("UPDATE public.smn_backup_retention"))<
   f.events.findIndex(x=>x.includes("INSERT INTO public.smn_backup_retention_audit")));
  assert.equal(f.events.at(-1),"COMMIT");
  assert.equal(f.open(),false);
 });
 it("rejoue une panne entre modification et audit : zéro changement commité",async()=>{
  const f=simulatedDb("audit");
  await assert.rejects(()=>updateBackupRetention(f.db,"admin-1",{days:45,revision:2}),/artificial-audit-failure/);
  assert.deepEqual(f.state(),{days:30,revision:2});
  assert.equal(f.events.at(-1),"ROLLBACK");
  assert.equal(f.open(),false);
 });
 it("annule également une panne durant l'écriture métier",async()=>{
  const f=simulatedDb("business");
  await assert.rejects(()=>updateBackupRetention(f.db,"admin-1",{days:45,revision:2}),/artificial-business-failure/);
  assert.deepEqual(f.state(),{days:30,revision:2});
  assert.equal(f.events.at(-1),"ROLLBACK");
 });
 it("annule un conflit sans simuler un succès d'audit",async()=>{
  const f=simulatedDb();
  const result=await updateBackupRetention(f.db,"admin-1",{days:45,revision:1});
  assert.deepEqual(result,{ok:false,error:"conflict"});
  assert.deepEqual(f.state(),{days:30,revision:2});
  assert.ok(!f.events.some(x=>x.includes("INSERT INTO public.smn_backup_retention_audit")));
  assert.equal(f.events.at(-1),"ROLLBACK");
 });
 it("réutilise le mécanisme sur deux étapes métier fictives",async()=>{
  const f=simulatedDb();
  const result=await withAtomicBusinessUnit(f.db,async()=>
   atomicAbort({ok:false,reason:"injected"}));
  assert.deepEqual(result,{ok:false,reason:"injected"});
  assert.equal(f.events.at(-1),"ROLLBACK");
  const success=await withAtomicBusinessUnit(f.db,async()=>atomicCommit({ok:true}));
  assert.equal(success.ok,true);
  assert.equal(f.events.at(-1),"COMMIT");
 });
});
describe("SMN-35 — protection additive des archives historiques",()=>{
 it("interdit les réécritures directes mais conserve les INSERT de nouvelles versions",()=>{
  assert.match(SMN35_ARCHIVE_IMMUTABILITY_SQL,/BEFORE UPDATE OR DELETE/);
  assert.match(SMN35_ARCHIVE_IMMUTABILITY_SQL,/smn_sprint_closure_snapshot/);
  assert.match(SMN35_ARCHIVE_IMMUTABILITY_SQL,/smn_report_pdf_archive/);
  assert.doesNotMatch(SMN35_ARCHIVE_IMMUTABILITY_SQL,/BEFORE INSERT/);
  assert.match(SMN35_ARCHIVE_GUARD_CHECK_SQL,/pg_catalog.pg_trigger/);
 });
});
