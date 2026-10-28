import assert from "node:assert/strict";
import test from "node:test";
import type {Client} from "pg";
import {readCapacitySynchronization,synchronizationStatus} from "../src/server/capacity/synchronization";
test("les erreurs ne sont jamais présentées comme synchronisées",()=>{
 assert.equal(synchronizationStatus({pending:1,running:0,failed:1}),"failed");
 assert.equal(synchronizationStatus({pending:1,running:1,failed:0}),"running");
 assert.equal(synchronizationStatus({pending:1,running:0,failed:0}),"pending");
 assert.equal(synchronizationStatus({pending:0,running:0,failed:0}),"up-to-date");
});
test("correction manuelle et période clôturée restent visibles sans écriture",async()=>{
 const sql:string[]=[];
 const db={query:async(q:string)=>{
  sql.push(q);
  if(q.includes("FROM public.smn_installation"))return {rows:[{schema_version:31}]};
  if(q.includes("FROM public.smn_capacity_period_override"))return {rows:[{
   closed_at:"2026-10-28",frozen_at:null,manual_jh:4,actual_manual:null}]};
  if(q.includes("to_regclass"))return {rows:[{present:true}]};
  return {rows:[{pending:1,running:0,failed:0,latest_completed_at:null}]};
 }} as unknown as Client;
 const result=await readCapacitySynchronization(db,"team-main","2026-10-01","2026-10-14");
 assert.equal(result.manualOverride,true);
 assert.equal(result.protectedPeriod,true);
 assert.equal(result.status,"pending");
 assert.equal(sql.some(q=>/^\s*(UPDATE|INSERT|DELETE)/i.test(q)),false);
});
test("version antérieure retourne non disponible sans lire la file",async()=>{
 const sql:string[]=[];
 const db={query:async(q:string)=>{sql.push(q);return {rows:[{schema_version:30}]};}} as unknown as Client;
 const status=await readCapacitySynchronization(db,"team-main","2026-10-01","2026-10-14");
 assert.equal(status.status,"not-available");
 assert.equal(sql.length,1);
});
