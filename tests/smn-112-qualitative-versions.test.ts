import test from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {readQualitativeVersion} from "../src/server/registries/qualitative-versions";
const id="11111111-1111-4111-8111-111111111111";
test("clôturé : dernière version, sans recalcul du registre courant",async()=>{
 const sql:string[]=[];
 const db={query:async(q:string)=>{sql.push(q);
  if(q.includes("SELECT s.status"))return {rows:[{status:"closed"}]};
  if(q.includes("to_regclass"))return {rows:[{exists:true}]};
  if(q.includes("SELECT version,closed_at"))return {rows:[{version:2,closedAt:"2026-10-23"},{version:1,closedAt:"2026-10-22"}]};
  if(q.includes("SELECT snapshot,version"))return {rows:[{snapshot:{qualitative:{items:[{id:"risk"}]}},version:2,closedAt:"2026-10-23"}]};
  return {rows:[]};
 }} as unknown as Client;
 const result=await readQualitativeVersion(db,"team",id,null);
 assert.equal(result?.state,"snapshot");assert.equal(result?.version,2);
 assert.equal(sql.some(q=>q.includes("smn_registry_cycle_link")),false);
});
test("absence de cliché ancien : provenance indisponible, jamais reconstituée",async()=>{
 const db={query:async(q:string)=>{
  if(q.includes("SELECT s.status"))return {rows:[{status:"closed"}]};
  if(q.includes("to_regclass"))return {rows:[{exists:false}]};
  return {rows:[]};
 }} as unknown as Client;
 const result=await readQualitativeVersion(db,"team",id,null);
 assert.equal(result?.state,"history-missing");
 assert.equal(result?.qualitative,null);
});
