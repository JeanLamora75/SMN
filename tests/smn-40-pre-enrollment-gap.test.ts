import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import type {Client} from "pg";
import {inspectGapRecords,interpretGapObservations,parseGapArgs}
 from "../scripts/smn-40-pre-enrollment-gap";

const archive="1a591fe3-f9c2-478f-a3fa-fdd7bfe37fb5";
const start="2026-11-11T10:08:03.761Z",end="2026-11-11T13:36:18.984Z";
test("SMN-40 gap: only an exact verified archive identifier and --check",()=>{
 assert.equal(parseGapArgs(["--archive",archive,"--check"]),archive);
 for(const args of [[],["--archive",archive,"--apply"],["--archive","invalid","--check"]])
  assert.throws(()=>parseGapArgs(args),/smn40-gap-arguments-invalid/);
});
test("SMN-40 gap: absence of recorded events never proves exhaustive coverage",()=>{
 const verdict=interpretGapObservations([
  {key:"member-removal",status:"observed",count:0},
  {key:"exceptional-erasure",status:"observed",count:0}
 ]);
 assert.deepEqual(verdict,{historicalAbsenceProven:false,auditCoverage:"partial",
  outcome:"no-recorded-operations-found"});
 assert.equal(interpretGapObservations([
  {key:"member-removal",status:"unavailable",count:null}
 ]).outcome,"incomplete-sources");
 assert.equal(interpretGapObservations([
  {key:"member-removal",status:"observed",count:1}
 ]).outcome,"recorded-operations-found");
});
test("SMN-40 gap: missing audit table is unavailable, not zero",async()=>{
 const statements:string[]=[];
 const db={query:async(sql:string)=>{
  statements.push(sql);
  if(sql.includes("information_schema.columns"))return {rows:[{present:false,date_column:false}]};
  throw Error("unreachable-count");
 }} as unknown as Client;
 const rows=await inspectGapRecords(db,start,end);
 assert.equal(rows.length,2);
 assert.ok(rows.every(row=>row.status==="unavailable"&&row.count===null));
 assert.ok(statements.every(sql=>!sql.includes("count(*)::text")));
});
test("SMN-40 gap: only whitelisted aggregate reads within exact interval",async()=>{
 const reads:{sql:string;args:unknown[]}[]=[];
 const db={query:async(sql:string,args:unknown[]=[])=>{
  reads.push({sql,args});
  if(sql.includes("information_schema.columns"))
   return {rows:[{present:true,date_column:true}]};
  return {rows:[{n:"0"}]};
 }} as unknown as Client;
 const result=await inspectGapRecords(db,start,end);
 assert.equal(result.length,2);
 assert.ok(result.every(row=>row.count===0));
 const counts=reads.filter(x=>x.sql.includes("count(*)::text"));
 assert.equal(counts.length,2);
 assert.ok(counts.every(x=>x.args[0]===start&&x.args[1]===end));
 assert.ok(counts.every(x=>/public\.smn_(member_removal_audit|privacy_erasure_receipt)/.test(x.sql)));
});
test("SMN-40 gap: script is read-only, no activation, no content or identity output",()=>{
 const source=readFileSync(new URL("../scripts/smn-40-pre-enrollment-gap.ts",import.meta.url),"utf8");
 assert.match(source,/REPEATABLE READ READ ONLY/);
 assert.match(source,/restorationAuthorized:false/);
 assert.doesNotMatch(source,/\b(?:DELETE FROM|DROP DATABASE|ALTER DATABASE|pg_restore|initializeErasureLedger|appendCompletedErasure)\s*\(/);
 assert.doesNotMatch(source,/console\.log\([^)]*(?:member_id|filename|password)/);
});
