import test from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {parseRoam,shouldAlertHighRisk,updateRiskRoam} from "../src/server/registries/roam";
test("ROAM distinct de la criticité et des statuts",()=>{
 assert.equal(parseRoam("resolved"),"resolved");
 assert.equal(parseRoam("open"),null);
 assert.equal(shouldAlertHighRisk("resolved",3,3),false);
 assert.equal(shouldAlertHighRisk("owned",3,3),true);
 assert.equal(shouldAlertHighRisk("owned",null,3),false);
});
test("ROAM transactionnel et audit, aucun changement de criticité",async()=>{
 const sql:string[]=[];
 const db={query:async(q:string)=>{
  sql.push(q);
  if(/^SELECT to_regclass\('public\.[^']+'\) AS present$/.test(q))return {rows:[{present:"migrated"}]};
  if(q.includes("SELECT r.id FROM public.smn_registry_item"))return {rows:[{id:"existing"}]};
  if(q.includes("SELECT classification,revision"))return {rows:[]};
  return {rows:[]};
 }} as unknown as Client;
 const id="11111111-1111-4111-8111-111111111111";
 const result=await updateRiskRoam(db,"actor",id,{classification:"mitigated",revision:0});
 assert.equal(result.ok,true);
 assert.equal(sql.at(-1),"COMMIT");
 assert.equal(sql.some(x=>/probability|impact|criticality/i.test(x)),false);
 assert.equal(sql.some(x=>x.includes("INSERT INTO public.smn_risk_roam_audit")),true);
});
test("refuse version obsolète avant mutation",async()=>{
 const sql:string[]=[];
 const db={query:async(q:string)=>{
  sql.push(q);
  if(/^SELECT to_regclass\('public\.[^']+'\) AS present$/.test(q))return {rows:[{present:"migrated"}]};
  if(q.includes("SELECT r.id FROM public.smn_registry_item"))return {rows:[{id:"existing"}]};
  if(q.includes("SELECT classification,revision"))return {rows:[{classification:"owned",revision:2}]};
  return {rows:[]};
 }} as unknown as Client;
 const result=await updateRiskRoam(db,"actor","11111111-1111-4111-8111-111111111111",{classification:"resolved",revision:1});
 assert.deepEqual(result,{ok:false,error:"conflict"});
 assert.equal(sql.at(-1),"ROLLBACK");
});
