import test from "node:test";
import assert from "node:assert/strict";
import {parseRegistryFilters,readRegistryPage} from "../src/server/registries/list";
import type {Client} from "pg";
test("type, statut, pagination et longueurs contrôlés",()=>{
 assert.deepEqual(parseRegistryFilters(new URLSearchParams()),{type:"all",search:"",status:"",owner:"",page:1,lifecycle:"all",sort:"default",cycleId:""});
 assert.equal(parseRegistryFilters(new URLSearchParams("type=risk&status=cancelled")),null);
 assert.equal(parseRegistryFilters(new URLSearchParams("type=dependency&status=satisfied"))?.status,"satisfied");
 assert.equal(parseRegistryFilters(new URLSearchParams("page=-1")),null);
 assert.equal(parseRegistryFilters(new URLSearchParams("type=other")),null);
});
test("aucun registre installé n'est jamais un résultat vide",async()=>{
 const db={query:async()=>({rows:[{present:false}]})} as unknown as Client;
 const result=await readRegistryPage(db,parseRegistryFilters(new URLSearchParams())!,false);
 assert.deepEqual(result,{state:"unavailable",reason:"not-installed"});
});
test("lecture user : aucune colonne nominative, aucun filtre responsable",async()=>{
 const sql:string[]=[];
 const db={query:async(statement:string)=>{
  sql.push(statement);
  if(statement.includes("to_regclass"))return {rows:[{present:true}]};
  if(statement.includes("FROM public.smn_team t"))return {rows:[{id:"team-1",name:"Team"}]};
  if(statement.includes("COUNT(*)"))return {rows:[{total:1}]};
  return {rows:[{id:"stable-id",title:"Known risk",status:"open",occurredOn:"2026-10-23"}]};
 }} as unknown as Client;
 const filters=parseRegistryFilters(new URLSearchParams("search=risk"))!;
 const result=await readRegistryPage(db,filters,false);
 assert.equal(result.state,"available");
 assert.ok(sql.some(s=>s.includes("ORDER BY CASE WHEN")&&s.includes("r.occurred_on DESC")));
 assert.ok(!sql.some(s=>s.includes('AS "owner"')));
 const blocked=await readRegistryPage(db,{...filters,owner:"Alice"},false);
 assert.deepEqual(blocked,{state:"forbidden"});
});
