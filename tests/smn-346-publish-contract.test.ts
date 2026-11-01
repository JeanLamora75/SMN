import {test} from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {publishFormula} from "../src/server/indicators/formula-publication";
const proposal={indicatorId:"indicator",formula:"A+2"};
const confirmation={globalRevision:"0",fingerprint:"a".repeat(64)};
test("retries techniques SQL bornés à deux essais, puis refus métier sans retry",async()=>{
 let begins=0,rollbacks=0;
 const db={query:async(sql:string)=>{
  if(sql==="BEGIN"){begins++;if(begins===1)throw Object.assign(Error("serialization"),{code:"40001"});return {rows:[]};}
  if(sql==="ROLLBACK"){rollbacks++;return {rows:[]};}
  if(sql.includes("smn_indicator_system_revision"))return {rows:[{revision:"9"}]};
  throw Error("unexpected query");
 }} as unknown as Client;
 assert.deepEqual(await publishFormula(db,proposal,confirmation),{ok:false,error:"stale_preview"});
 assert.equal(begins,2);assert.equal(rollbacks,1);
});
test("erreur technique permanente n'est jamais rejouée",async()=>{
 let begins=0;
 const db={query:async()=>{begins++;throw Object.assign(Error("failure"),{code:"22003"});}} as unknown as Client;
 await assert.rejects(()=>publishFormula(db,proposal,confirmation),/failure/);
 assert.equal(begins,1);
});
test("une erreur transitoire réitérée échoue après deux essais",async()=>{
 let begins=0;
 const db={query:async()=>{begins++;throw Object.assign(Error("deadlock"),{code:"40P01"});}} as unknown as Client;
 await assert.rejects(()=>publishFormula(db,proposal,confirmation),/deadlock/);
 assert.equal(begins,2);
});
