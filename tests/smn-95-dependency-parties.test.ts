import test from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {parseParty,writeParties} from "../src/server/registries/dependency-parties";
const id="11111111-1111-4111-8111-111111111111";
test("équipe locale vérifiée et équipe externe texte libre",()=>{
 assert.deepEqual(parseParty({kind:"local",teamId:"t1"},"t1"),{kind:"local",teamId:"t1"});
 assert.equal(parseParty({kind:"local",teamId:"unknown"},"t1"),null);
 assert.deepEqual(parseParty({kind:"external",name:"  Fournisseur  "},"t1"),{kind:"external",name:"Fournisseur"});
 assert.equal(parseParty({kind:"external",name:" "},"t1"),null);
});
test("sauvegarde unique et historisée, sans création d'équipe fictive",async()=>{
 const sql:string[]=[];
 const db={query:async(q:string)=>{sql.push(q);if(q.startsWith("SELECT to_regclass(")&&q.endsWith(" AS present"))return {rows:[{present:"migrated"}]};
  if(q.includes("SELECT r.id,r.team_id"))return {rows:[{id,team_id:"t1"}]};
  return {rows:[]};
 }} as unknown as Client;
 const r=await writeParties(db,"admin",id,{revision:0,
  requester:{kind:"local",teamId:"t1"},contributor:{kind:"external",name:"Vendor"}});
 assert.equal(r.ok,true);assert.equal(sql.at(-1),"COMMIT");
 assert.equal(sql.some(q=>/INSERT INTO public.smn_team|INSERT INTO public.smn_account/i.test(q)),false);
 assert.equal(sql.some(q=>q.includes("INSERT INTO public.smn_dependency_parties_audit")),true);
});
test("absence de portée interdit toute sauvegarde",async()=>{
 const sql:string[]=[];
 const db={query:async(q:string)=>{sql.push(q);if(q.startsWith("SELECT to_regclass(")&&q.endsWith(" AS present"))return {rows:[{present:"migrated"}]};return {rows:[]};}} as unknown as Client;
 const r=await writeParties(db,"admin",id,{revision:0,requester:{kind:"local",teamId:"t1"},contributor:{kind:"external",name:"Vendor"}});
 assert.deepEqual(r,{ok:false,error:"not-found"});
 assert.equal(sql.at(-1),"ROLLBACK");
});
