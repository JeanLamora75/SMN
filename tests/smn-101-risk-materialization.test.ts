import test from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {createObstacleFromRisk} from "../src/server/registries/risk-materialization";
const id="11111111-1111-4111-8111-111111111111";
const input={teamId:"team1",type:"obstacle",title:"Blocked",occurredOn:"2026-10-23",status:"open"};
test("confirme un obstacle distinct et son lien dans une unique transaction",async()=>{
 const sql:string[]=[];
 const db={query:async(q:string)=>{sql.push(q);if(q.startsWith("SELECT to_regclass(")&&q.endsWith(" AS present"))return {rows:[{present:"migrated"}]};return {rows:q.includes("SELECT r.id,r.team_id FROM public.smn_registry_item")?[{id,team_id:"team1"}]:[]};}} as unknown as Client;
 const r=await createObstacleFromRisk(db,"admin",id,input);
 assert.equal(r.ok,true);if(!r.ok)return;
 assert.notEqual(r.id,id);assert.equal(sql.at(-1),"COMMIT");
 assert.ok(sql.some(q=>q.includes("INSERT INTO public.smn_registry_item_audit")));
 assert.ok(sql.some(q=>q.includes("INSERT INTO public.smn_registry_relation_audit")));
 assert.ok(!sql.some(q=>q.includes("UPDATE public.smn_registry_item")||q.includes("UPDATE public.smn_risk_roam")||q.includes("UPDATE public.smn_risk_assessment")));
});
test("échec de liaison annule création et audit",async()=>{
 const sql:string[]=[];
 const db={query:async(q:string)=>{sql.push(q);if(q.startsWith("SELECT to_regclass(")&&q.endsWith(" AS present"))return {rows:[{present:"migrated"}]};
  if(q.includes("SELECT r.id,r.team_id FROM public.smn_registry_item"))return {rows:[{id,team_id:"team1"}]};
  if(q.includes("INSERT INTO public.smn_registry_relation(id"))throw Error("relation-failed");
  return {rows:[]};
 }} as unknown as Client;
 await assert.rejects(()=>createObstacleFromRisk(db,"admin",id,input));
 assert.equal(sql.at(-1),"ROLLBACK");
});
test("validation refuse risque hors équipe sans nouveau lien",async()=>{
 const sql:string[]=[];
 const db={query:async(q:string)=>{sql.push(q);if(q.startsWith("SELECT to_regclass(")&&q.endsWith(" AS present"))return {rows:[{present:"migrated"}]};return {rows:[]};}} as unknown as Client;
 assert.deepEqual(await createObstacleFromRisk(db,"admin",id,input),{ok:false,error:"not-found"});
 assert.equal(sql.at(-1),"ROLLBACK");
});
