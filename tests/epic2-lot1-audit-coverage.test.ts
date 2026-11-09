import assert from "node:assert/strict";
import {describe,it} from "node:test";
import type {Client} from "pg";
import {readAuditJournal,projectAuditEvent} from "../src/server/audit/journal";
import {MEMBER_REMOVAL_AUDIT_SQL} from "../src/server/members/removal-audit";
import {SMN35_ARCHIVE_IMMUTABILITY_SQL} from "../src/server/backup/archive-immutability";

const utc=new Date("2026-11-09T09:00:00.000Z");
describe("Epic 2 lot 1 — audit transversal et migrations sûres",()=>{
 it("rejette les détails bruts et ne projette que les types d'audits autorisés",()=>{
  const samples=[
   ["backup_policy_changed","backup"],["backup_package_deleted","backup"],
   ["sprint_changed","sprint"],["member_archived","member"],
   ["member_reactivated","member"],["member_assignment_closed","member"],
   ["team_context_changed","team"],["registry_item_changed","registry"],
   ["pdf_archive_recorded","report"],["member_removed","member"]
  ];
  for(const [action,object_type] of samples){
   const entry=projectAuditEvent({id:"operation-id",occurred_at:utc,actor_id:"actor-id",
    action,object_type,object_id:"technical-id",scope:"singleton",result:"success",
    old_values:{display_name:"SENSITIVE",email:"private@example.test"},
    new_values:{password_hash:"SECRET",body:"confidential"}} as never);
   assert.equal(entry?.action,action);
   assert.deepEqual(entry?.changes,{before:{},after:{}});
   assert.doesNotMatch(JSON.stringify(entry),/SENSITIVE|SECRET|confidential|example.test/);
  }
 });
 it("refuse les événements échoués ou le mauvais type d'objet",()=>{
  const row={id:"id",occurred_at:utc,actor_id:"actor",action:"member_removed",
   object_type:"member",object_id:"id",scope:"singleton",result:"success",
   old_values:{},new_values:{}};
  assert.equal(projectAuditEvent({...row,result:"failed"}),null);
  assert.equal(projectAuditEvent({...row,object_type:"account"}),null);
 });
 it("lit les suppressions uniquement si la table additive existe",async()=>{
  const queries:string[]=[];
  const client={query:async(sql:string)=>{
   queries.push(sql);
   if(sql.includes("to_regclass("))return {rows:[{present:true}]};
   if(sql.includes("FROM public.smn_member_removal_audit"))
    return {rows:[{id:"removal-id",occurred_at:utc,actor_id:"admin",
     action:"member_removed",object_type:"member",object_id:"member-id",
     scope:"singleton",result:"success",old_values:{},new_values:{}}]};
   return {rows:[]};
  }} as unknown as Client;
  const r=await readAuditJournal(client,100);
  assert.equal(r.length,1);
  assert.equal(r[0].action,"member_removed");
  assert.ok(queries.some(s=>s.includes("FROM public.smn_member_removal_audit")));
 });
 it("SQL idempotent, PL/pgSQL correctement dollar-quoté, aucune mutation INSERT bloquée",()=>{
  assert.match(MEMBER_REMOVAL_AUDIT_SQL,/AS \$smn36_guard\$/);
  assert.match(MEMBER_REMOVAL_AUDIT_SQL,/\$smn36_guard\$;/);
  assert.match(MEMBER_REMOVAL_AUDIT_SQL,/CREATE OR REPLACE TRIGGER/);
  assert.doesNotMatch(MEMBER_REMOVAL_AUDIT_SQL,/LANGUAGE plpgsql AS \$\n/);
  assert.match(SMN35_ARCHIVE_IMMUTABILITY_SQL,/CREATE OR REPLACE TRIGGER/);
  assert.match(SMN35_ARCHIVE_IMMUTABILITY_SQL,/BEFORE UPDATE OR DELETE/);
  assert.doesNotMatch(SMN35_ARCHIVE_IMMUTABILITY_SQL,/BEFORE INSERT/);
 });
});
