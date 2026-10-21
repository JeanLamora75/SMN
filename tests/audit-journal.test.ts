import assert from "node:assert/strict";
import {describe,it} from "node:test";
import type {Client} from "pg";
import {readAuditJournal,projectAuditEvent,sanitizeAuditValues} from "../src/server/audit/journal";
import {createAccount,updateAccount} from "../src/server/accounts/manager";
import {canAccess} from "../src/server/access-policy";
import {ACCOUNT_AUDIT_MIGRATION_SQL} from "../src/server/audit/account-migration";
const actor=(role:string)=>({role,is_active:true,must_change_password:false});
const row={id:"ev-1",occurred_at:new Date("2026-10-21T08:00:00Z"),actor_id:"admin-id",
 action:"account_updated",object_type:"account",object_id:"target-id",scope:"singleton",
 result:"success",old_values:{role:"user",isActive:true,email:"hidden@example.test"},
 new_values:{role:"admin",isActive:true,password_hash:"secret"}};
const account={id:"target-id",username:"staff",email:"private@example.test",role:"user" as const,
 is_active:true,must_change_password:false,created_at:new Date()};
describe("SMN-29 — audit sécurisé et transactionnel",()=>{
 it("projette uniquement les champs explicitement autorisés",()=>{
  const event=projectAuditEvent(row);
  assert.deepEqual(event?.changes,{before:{role:"user",isActive:true},after:{role:"admin",isActive:true}});
  assert.equal(event?.occurredAt,"2026-10-21T08:00:00.000Z");
  assert.doesNotMatch(JSON.stringify(event),/example.test|password_hash|secret/);
  assert.deepEqual(sanitizeAuditValues("settings_updated",
   {locale:"en",theme:"dark",palette:"forest",referenceCountry:"FR",credentials:"bad"}),
   {locale:"en",theme:"dark",palette:"forest",referenceCountry:"FR"});
 });
 it("ne classe jamais un échec, un objet inconnu ou un statut douteux comme réussite",()=>{
  for(const bad of [{...row,result:"failed"},{...row,scope:"other"},
   {...row,action:"arbitrary"},{...row,object_type:"settings"}])assert.equal(projectAuditEvent(bad),null);
 });
 it("limite et lit le journal unifié sans noms/e-mails de compte",async()=>{
  const calls:{sql:string;params:unknown[]}[]=[];
  const client={query:async(sql:string,params:unknown[])=>{
    calls.push({sql,params});return {rows:[row]};
  }} as unknown as Client;
  const events=await readAuditJournal(client,5000);
  assert.equal(events.length,1);
  assert.deepEqual(calls[0].params,[100]);
  assert.match(calls[0].sql,/smn_account_audit/);
  assert.match(calls[0].sql,/smn_auth_audit/);
  assert.match(calls[0].sql,/smn_general_settings_audit/);
  assert.doesNotMatch(JSON.stringify(events),/example.test|password_hash/);
 });
 it("autorise la lecture du journal uniquement à l'administrateur actif",()=>{
  const resource={type:"audit",exists:true,inScope:true};
  assert.equal(canAccess(actor("admin"),"read",resource),true);
  assert.equal(canAccess(actor("user"),"read",resource),false);
  assert.equal(canAccess({...actor("admin"),is_active:false},"read",resource),false);
  assert.equal(canAccess(actor("admin"),"read",{...resource,inScope:false}),false);
 });
 it("enregistre la création et une seule référence d'audit avant COMMIT",async()=>{
  const calls:{sql:string;params:unknown[]}[]=[];
  const client={query:async(sql:string,params:unknown[]=[])=>{
    calls.push({sql,params});
    if(sql.includes("INSERT INTO public.smn_account\n"))
      return {rowCount:1,rows:[account]};
    return {rowCount:1,rows:[]};
  }} as unknown as Client;
  const result=await createAccount(client,{username:"staff",email:"private@example.test",role:"user",password:"Password-2026"},"admin-id");
  assert.equal(result.ok,true);
  const statements=calls.map(x=>x.sql);
  const auditIndex=statements.findIndex(x=>x.includes("INSERT INTO public.smn_account_audit"));
  assert.ok(auditIndex>0&&auditIndex<statements.indexOf("COMMIT"));
  assert.equal(statements[0],"BEGIN");
  assert.equal(statements.filter(x=>x==="COMMIT").length,1);
  assert.doesNotMatch(JSON.stringify(calls[auditIndex].params),/Password-2026|private@example.test/);
 });
 it("refus d'audit : transaction de création entièrement annulée",async()=>{
  const calls:string[]=[];
  const client={query:async(sql:string)=>{
    calls.push(sql);
    if(sql.includes("INSERT INTO public.smn_account\n"))return {rowCount:1,rows:[account]};
    if(sql.includes("INSERT INTO public.smn_account_audit"))throw new Error("audit-storage-failed");
    return {rowCount:1,rows:[]};
  }} as unknown as Client;
  await assert.rejects(()=>createAccount(client,{username:"staff",email:"private@example.test",role:"user",password:"Password-2026"},"admin-id"),/audit-storage-failed/);
  assert.ok(calls.includes("ROLLBACK"));
  assert.ok(!calls.includes("COMMIT"));
 });
 it("une modification idempotente n'invente aucune entrée et une mutation en crée exactement une",async()=>{
  const calls:{sql:string;params:unknown[]}[]=[];
  const client={query:async(sql:string,params:unknown[]=[])=>{
    calls.push({sql,params});
    if(sql.includes("SELECT id,username,email,role,is_active"))return {rowCount:1,rows:[account]};
    if(sql.includes("UPDATE public.smn_account SET role="))
     return {rowCount:1,rows:[{...account,role:"admin"}]};
    return {rowCount:1,rows:[]};
  }} as unknown as Client;
  const noChange=await updateAccount(client,"target-id","admin-id",{role:"user",isActive:true});
  assert.equal(noChange.ok,true);
  assert.ok(!calls.some(x=>x.sql.includes("INSERT INTO public.smn_account_audit")));
  calls.length=0;
  const changed=await updateAccount(client,"target-id","admin-id",{role:"admin",isActive:true});
  assert.equal(changed.ok,true);
  const audit=calls.find(x=>x.sql.includes("INSERT INTO public.smn_account_audit"));
  assert.ok(audit);
  assert.equal(calls.filter(x=>x.sql.includes("INSERT INTO public.smn_account_audit")).length,1);
  assert.ok(calls.findIndex(x=>x.sql.includes("INSERT INTO public.smn_account_audit"))<calls.findIndex(x=>x.sql==="COMMIT"));
  assert.equal(JSON.stringify(audit.params).includes("private@example.test"),false);
 });
 it("migration additive sans mot de passe et avec version explicite",()=>{
  assert.match(ACCOUNT_AUDIT_MIGRATION_SQL,/CREATE TABLE public.smn_account_audit/);
  assert.match(ACCOUNT_AUDIT_MIGRATION_SQL,/schema_version=7/);
  assert.doesNotMatch(ACCOUNT_AUDIT_MIGRATION_SQL,/password_hash|email|DROP TABLE|TRUNCATE/);
 });
});
