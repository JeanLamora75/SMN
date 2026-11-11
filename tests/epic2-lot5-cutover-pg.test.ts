import {test} from "node:test";
import assert from "node:assert/strict";
import {randomUUID,randomBytes} from "node:crypto";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {Client} from "pg";
import {rehearseOfflineDatabaseCutover,readCutoverDrillJournal,
 validateCutoverDrill} from "../src/server/backup/restore-cutover-drill";

test("SMN-34 lot 5 — PostgreSQL 18 offline cutover and failure rollback",
 {timeout:120000},async()=>{
 const url=process.env.SMN_TEST_DATABASE_URL;
 if(!url)throw Error("SMN_TEST_DATABASE_URL required");
 const u=new URL(url);
 if(!["127.0.0.1","localhost","[::1]"].includes(u.hostname)||
  u.pathname!=="/postgres")throw Error("maintenance URL must be local /postgres");
 const suffix=randomUUID().replaceAll("-","").slice(0,12);
 const orig="smn_restore_test_orig_"+suffix;
 const cand="smn_restore_test_cand_"+suffix;
 const prev="smn_restore_test_prev_"+suffix;
 const two="smn_restore_test_fail_"+suffix;
 const other="smn_restore_test_next_"+suffix;
 const spare="smn_restore_test_spare_"+suffix;
 const dir=await mkdtemp(join(tmpdir(),"smn34-cutover-"));
 const maint=new Client({connectionString:url});
 const created:string[]=[];
 const dbUrl=(name:string)=>{const uri=new URL(url);uri.pathname="/"+name;return uri.toString();};
 const populate=async(name:string,version:string)=>{
  const db=new Client({connectionString:dbUrl(name)});
  try{
   await db.connect();
   await db.query("CREATE TABLE public.restore_probe(value text PRIMARY KEY)");
   await db.query("INSERT INTO public.restore_probe(value) VALUES($1)",[version]);
  }finally{await db.end();}
 };
 const probe=async(name:string)=>{
  const db=new Client({connectionString:dbUrl(name)});
  try{await db.connect();return (await db.query<{value:string}>(
   "SELECT value FROM public.restore_probe")).rows[0]?.value;}
  finally{await db.end();}
 };
 try{
  await maint.connect();
  const server=await maint.query<{v:string}>(
   "SELECT current_setting('server_version') AS v");
  assert.match(server.rows[0].v,/^18\./);
  for(const name of [orig,cand,two,other]){
   await maint.query('CREATE DATABASE "'+name+'"');created.push(name);
  }
  await populate(orig,"before");
  await populate(cand,"restored");
  await populate(two,"before-failure");
  await populate(other,"candidate-failure");
  const base={maintenanceUri:url,original:orig,candidate:cand,
   rollback:prev,journalDir:dir,auditKeyHex:randomBytes(32).toString("hex")};
  assert.equal(validateCutoverDrill(base),true);
  assert.equal(validateCutoverDrill({...base,original:"production"}),false);
  assert.equal(validateCutoverDrill({...base,rollback:orig}),false);
  const outcome=await rehearseOfflineDatabaseCutover(base);
  assert.equal(outcome.stage,"verified");
  assert.equal(outcome.rollbackPreserved,true);
  assert.deepEqual((await readCutoverDrillJournal(outcome.journal,base.auditKeyHex))
   .map(e=>e.stage),["intent","source-parked","candidate-promoted","verified"]);
  assert.equal(await probe(orig),"restored");
  assert.equal(await probe(prev),"before");
  const reverted=await rehearseOfflineDatabaseCutover({
   ...base,candidate:prev,rollback:spare
  });
  assert.equal(reverted.stage,"verified");
  assert.equal(await probe(orig),"before");
  assert.equal(await probe(spare),"restored");
  const injected=await rehearseOfflineDatabaseCutover({
   ...base,original:two,candidate:other,rollback:prev,
   injectFailureAfterPark:true
  });
  assert.equal(injected.stage,"rolled-back");
  assert.deepEqual((await readCutoverDrillJournal(injected.journal,base.auditKeyHex))
   .map(e=>e.stage),["intent","source-parked","rollback-started","rolled-back"]);
  assert.equal(await probe(two),"before-failure");
  assert.equal(await probe(other),"candidate-failure");
  const postPromotion=await rehearseOfflineDatabaseCutover({
   ...base,original:two,candidate:other,rollback:prev,
   injectFailureAfterPromotion:true
  });
  assert.equal(postPromotion.stage,"rolled-back");
  assert.deepEqual((await readCutoverDrillJournal(
   postPromotion.journal,base.auditKeyHex)).map(e=>e.stage),
   ["intent","source-parked","candidate-promoted","rollback-started","rolled-back"]);
  assert.equal(await probe(two),"before-failure");
  assert.equal(await probe(other),"candidate-failure");
  const busy=new Client({connectionString:dbUrl(two)});
  try{
   await busy.connect();
   await assert.rejects(
    rehearseOfflineDatabaseCutover({
     ...base,original:two,candidate:other,rollback:prev
    }),/cutover-denied/);
   assert.equal(await probe(two),"before-failure");
  }finally{await busy.end();}
  process.stdout.write("SMN34-CUTOVER: verified, rollback, crash injection, busy veto\n");
 }finally{
  for(const name of [orig,cand,prev,two,other,spare]){
   await maint.query('DROP DATABASE IF EXISTS "'+name+'" WITH (FORCE)').catch(()=>undefined);
  }
  await maint.end().catch(()=>undefined);
  await rm(dir,{recursive:true,force:true});
 }
});
