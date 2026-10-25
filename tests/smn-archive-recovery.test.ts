import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,mkdir,rm,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {createHash} from "node:crypto";
import {inspectArchiveRecovery} from "../src/server/reports/archive-recovery";
import type {Client} from "pg";

test("recovery inventory separates valid, corrupt, missing and orphan PDF files without mutations",async()=>{
 const dir=await mkdtemp(join(tmpdir(),"smn-archive-recovery-"));
 const previous=process.env.SMN_PRIVATE_REPORT_ARCHIVE_DIR;
 process.env.SMN_PRIVATE_REPORT_ARCHIVE_DIR=dir;
 const valid="11111111-1111-4111-8111-111111111111.pdf";
 const corrupt="22222222-2222-4222-8222-222222222222.pdf";
 const missing="33333333-3333-4333-8333-333333333333.pdf";
 const orphan="44444444-4444-4444-8444-444444444444.pdf";
 const bytes=Buffer.from("%PDF-1.4\n"+("x".repeat(48))+"\n%%EOF\n");
 try{
  await writeFile(join(dir,valid),bytes);
  await writeFile(join(dir,corrupt),Buffer.from("corrupt"));
  await writeFile(join(dir,orphan),bytes);
  await mkdir(join(dir,"unrelated"));
  const records=[
   {stored_name:valid,sha256:createHash("sha256").update(bytes).digest("hex"),byte_length:bytes.length},
   {stored_name:corrupt,sha256:"0".repeat(64),byte_length:100},
   {stored_name:missing,sha256:"0".repeat(64),byte_length:100}
  ];
  const db={query:async(sql:string)=>sql.includes("to_regclass")?{rows:[{exists:true}]}:{rows:records}} as unknown as Client;
  const findings=await inspectArchiveRecovery(db);
  assert.deepEqual(Object.fromEntries(findings.map(item=>[item.filename,item.status])),{
   [valid]:"registered",[corrupt]:"integrity-mismatch",[missing]:"missing",[orphan]:"orphan-candidate"
  });
 }finally{
  if(previous===undefined)delete process.env.SMN_PRIVATE_REPORT_ARCHIVE_DIR;
  else process.env.SMN_PRIVATE_REPORT_ARCHIVE_DIR=previous;
  await rm(dir,{recursive:true,force:true});
 }
});
