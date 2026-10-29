import test from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {updateRegistryItem,readRegistryHistory} from "../src/server/registries/items";
const old={id:"11111111-1111-4111-8111-111111111111",team_id:"team-1",type:"risk",
 title:"Initial",occurred_on:"2026-10-23",status:"open",description:null,owner_name:null,
 due_on:null,comment:null,revision:1};
const body={teamId:"team-1",type:"risk",title:"Updated",occurredOn:"2026-10-23",status:"resolved"};
test("modification transactionnelle et version immuable",async()=>{
 const sql:string[]=[];
 const db={query:async(q:string)=>{sql.push(q);if(q.startsWith("SELECT to_regclass(")&&q.endsWith(" AS present"))return {rows:[{present:"migrated"}]};return {rows:q.includes("SELECT r.id,r.team_id,r.type")?[old]:[]};}} as unknown as Client;
 const r=await updateRegistryItem(db,"actor-1",old.id,1,body);
 assert.deepEqual(r,{ok:true,id:old.id,revision:2});
 assert.ok(sql.some(q=>q.includes("revision=revision+1")));
 assert.ok(sql.some(q=>q.includes("INSERT INTO public.smn_registry_item_audit")));
 assert.equal(sql.at(-1),"COMMIT");
});
test("révision périmée refusée sans UPDATE ni audit",async()=>{
 const sql:string[]=[];
 const db={query:async(q:string)=>{sql.push(q);if(q.startsWith("SELECT to_regclass(")&&q.endsWith(" AS present"))return {rows:[{present:"migrated"}]};return {rows:q.includes("SELECT r.id,r.team_id,r.type")?[old]:[]};}} as unknown as Client;
 const r=await updateRegistryItem(db,"actor-1",old.id,2,body);
 assert.deepEqual(r,{ok:false,error:"conflict"});
 assert.equal(sql.at(-1),"ROLLBACK");
 assert.equal(sql.some(q=>q.includes("INSERT INTO public.smn_registry_item_audit")),false);
});
test("erreur audit annule la transaction entière",async()=>{
 const sql:string[]=[];
 const db={query:async(q:string)=>{sql.push(q);if(q.startsWith("SELECT to_regclass(")&&q.endsWith(" AS present"))return {rows:[{present:"migrated"}]};
  if(q.includes("SELECT r.id,r.team_id,r.type"))return {rows:[old]};
  if(q.includes("INSERT INTO public.smn_registry_item_audit"))throw Error("audit-failed");
  return {rows:[]};
 }} as unknown as Client;
 await assert.rejects(()=>updateRegistryItem(db,"actor-1",old.id,1,body));
 assert.equal(sql.at(-1),"ROLLBACK");
});
test("historique: lecture sans DDL et tri descendant",async()=>{
 const sql:string[]=[];
 const db={query:async(q:string)=>{sql.push(q);if(q.startsWith("SELECT to_regclass(")&&q.endsWith(" AS present"))return {rows:[{present:"migrated"}]};return {rows:q.includes("SELECT r.id FROM")?[{id:old.id}]:[]};}} as unknown as Client;
 const result=await readRegistryHistory(db,old.id);
 assert.equal(result?.id,old.id);
 assert.ok(sql.some(q=>q.includes("ORDER BY revision DESC")));
 assert.equal(sql.some(q=>/CREATE|UPDATE|INSERT/i.test(q)),false);
});
