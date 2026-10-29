import test from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {saveDecisionDetail} from "../src/server/registries/decision-detail";
const id="11111111-1111-4111-8111-111111111111";
test("refus de se remplacer soi-même",async()=>{
 const r=await saveDecisionDetail({} as Client,"admin",id,{rationale:"reason",replacesId:id,revision:0});
 assert.deepEqual(r,{ok:false,error:"invalid-input"});
});
test("lien de remplacement sécurisé et historisé sans modifier l'ancienne décision",async()=>{
 const sql:string[]=[];
 const db={query:async(q:string)=>{sql.push(q);if(q.startsWith("SELECT to_regclass(")&&q.endsWith(" AS present"))return {rows:[{present:"migrated"}]};
  if(q.includes("SELECT r.team_id,r.status"))return {rows:[{team_id:"team-1",status:"active"}]};
  if(q.includes("SELECT 1 FROM public.smn_registry_item"))return {rows:[{one:1}]};
  return {rows:[]};
 }} as unknown as Client;
 const r=await saveDecisionDetail(db,"admin",id,{
  rationale:"New rationale",replacesId:"22222222-2222-4222-8222-222222222222",revision:0});
 assert.equal(r.ok,true);
 assert.equal(sql.at(-1),"COMMIT");
 assert.ok(sql.some(q=>q.includes("INSERT INTO public.smn_decision_detail_audit")));
 assert.ok(!sql.some(q=>q.includes("UPDATE public.smn_registry_item SET")));
});
test("cible inexistante annulée sans écriture de détail",async()=>{
 const sql:string[]=[];
 const db={query:async(q:string)=>{sql.push(q);if(q.startsWith("SELECT to_regclass(")&&q.endsWith(" AS present"))return {rows:[{present:"migrated"}]};return {rows:q.includes("SELECT r.team_id,r.status")?[{team_id:"team-1",status:"active"}]:[]};}} as unknown as Client;
 const r=await saveDecisionDetail(db,"admin",id,{rationale:null,replacesId:"22222222-2222-4222-8222-222222222222",revision:0});
 assert.deepEqual(r,{ok:false,error:"invalid-target"});
 assert.equal(sql.at(-1),"ROLLBACK");
});
