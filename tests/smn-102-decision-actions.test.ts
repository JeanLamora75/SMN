import test from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {createActionFromDecision} from "../src/server/registries/decision-actions";
const id="11111111-1111-4111-8111-111111111111",raw={teamId:"team",type:"action",title:"Follow up",occurredOn:"2026-10-23",status:"todo"};
test("deux confirmations créent deux actions distinctes liées à la décision",async()=>{
 const sql:string[]=[];
 const db={query:async(q:string)=>{sql.push(q);if(q.startsWith("SELECT to_regclass(")&&q.endsWith(" AS present"))return {rows:[{present:"migrated"}]};return {rows:q.includes("SELECT r.id FROM public.smn_registry_item")?[{id}]:[]};}} as unknown as Client;
 const first=await createActionFromDecision(db,"admin",id,raw),second=await createActionFromDecision(db,"admin",id,raw);
 assert.equal(first.ok,true);assert.equal(second.ok,true);
 if(first.ok&&second.ok)assert.notEqual(first.id,second.id);
 assert.equal(sql.filter(q=>q.includes("INSERT INTO public.smn_action_link(action_id")).length,2);
 assert.ok(!sql.some(q=>q.includes("UPDATE public.smn_registry_item")));
});
test("échec de lien annule transaction et audit",async()=>{
 const sql:string[]=[];
 const db={query:async(q:string)=>{sql.push(q);if(q.startsWith("SELECT to_regclass(")&&q.endsWith(" AS present"))return {rows:[{present:"migrated"}]};
  if(q.includes("SELECT r.id FROM public.smn_registry_item"))return {rows:[{id}]};
  if(q.includes("INSERT INTO public.smn_action_link(action_id"))throw Error("fail");
  return {rows:[]};
 }} as unknown as Client;
 await assert.rejects(()=>createActionFromDecision(db,"admin",id,raw));
 assert.equal(sql.at(-1),"ROLLBACK");
});
