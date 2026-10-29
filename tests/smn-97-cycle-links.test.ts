import test from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {changeCycleLink} from "../src/server/registries/cycle-links";
const id="11111111-1111-4111-8111-111111111111",cycle="22222222-2222-4222-8222-222222222222";
test("association atomique sans duplication de fiche ou mutation de Sprint",async()=>{
 const sql:string[]=[];
 const db={query:async(q:string)=>{sql.push(q);if(q.startsWith("SELECT to_regclass(")&&q.endsWith(" AS present"))return {rows:[{present:"migrated"}]};
  if(q.includes("SELECT r.id FROM public.smn_registry_item"))return {rows:[{id}]};
  return {rows:[]};
 }} as unknown as Client;
 assert.deepEqual(await changeCycleLink(db,"admin",id,cycle,"linked"),{ok:true});
 assert.equal(sql.at(-1),"COMMIT");
 assert.ok(sql.some(q=>q.includes("INSERT INTO public.smn_registry_cycle_link_audit")));
 assert.ok(!sql.some(q=>q.includes("UPDATE public.smn_sprint")||q.includes("UPDATE public.smn_registry_item")));
});
test("association interdite refusée sans audit",async()=>{
 const sql:string[]=[];
 const db={query:async(q:string)=>{sql.push(q);if(q.startsWith("SELECT to_regclass(")&&q.endsWith(" AS present"))return {rows:[{present:"migrated"}]};return {rows:[]};}} as unknown as Client;
 assert.deepEqual(await changeCycleLink(db,"admin",id,cycle,"linked"),{ok:false,error:"not-found"});
 assert.equal(sql.at(-1),"ROLLBACK");
 assert.ok(!sql.some(q=>q.includes("INSERT INTO public.smn_registry_cycle_link_audit")));
});
