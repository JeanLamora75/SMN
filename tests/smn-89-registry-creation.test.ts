import test from "node:test";
import assert from "node:assert/strict";
import {parseRegistryInput,validDate,createRegistryItem} from "../src/server/registries/items";
import type {Client} from "pg";
import {registryTypes,registryStatuses} from "../src/lib/registry-types";
const base={teamId:"team-1",title:"  Un sujet  ",occurredOn:"2026-10-23"};
test("six categories et statuts propres",()=>{
 assert.equal(registryTypes.length,6);
 for(const type of registryTypes){
  const parsed=parseRegistryInput({...base,type});
  assert.ok(parsed);
  assert.equal(parsed.title,"Un sujet");
  assert.equal(parsed.status,registryStatuses[type][0]);
  for(const status of registryStatuses[type])assert.equal(parseRegistryInput({...base,type,status})?.status,status);
 }
});
test("date civile stricte, titre et champs facultatifs",()=>{
 assert.equal(validDate("2026-02-29"),false);
 assert.equal(validDate("2024-02-29"),true);
 assert.equal(parseRegistryInput({...base,type:"risk",title:" "}),null);
 assert.equal(parseRegistryInput({...base,type:"risk",dueOn:"2026-02-30"}),null);
 assert.equal(parseRegistryInput({...base,type:"risk",status:"cancelled"}),null);
 const result=parseRegistryInput({...base,type:"dependency"});
 assert.equal(result?.dueOn,null);assert.equal(result?.owner,null);
 assert.equal(result?.description,null);assert.equal(result?.comment,null);
});
test("aucun lien à un cycle obligatoire",()=>{
 const result=parseRegistryInput({...base,type:"risk"});
 assert.ok(result);assert.equal(Object.hasOwn(result,"sprintId"),false);
});

test("transaction atomique et audit pour une creation autorisee",async()=>{
 const sql:string[]=[];
 const fake={query:async (statement:string)=>{
  sql.push(statement);
  if(/^SELECT to_regclass\('public\.[^']+'\) AS present$/.test(statement))return {rows:[{present:"migrated"}]};
  return {rows:statement.includes("SELECT t.id")?[{id:"team-1"}]:[]};
 }} as unknown as Client;
 const result=await createRegistryItem(fake,"actor-1",{...base,type:"risk"});
 assert.equal(result.ok,true);
 assert.ok(sql.some(x=>x.includes("INSERT INTO public.smn_registry_item\n")));
 assert.ok(sql.some(x=>x.includes("INSERT INTO public.smn_registry_item_audit")));
 assert.equal(sql.at(-1),"COMMIT");
});
test("echec SQL: rollback sans succes declare",async()=>{
 const sql:string[]=[];
 const fake={query:async (statement:string)=>{
  sql.push(statement);
  if(/^SELECT to_regclass\('public\.[^']+'\) AS present$/.test(statement))return {rows:[{present:"migrated"}]};
  if(statement.includes("SELECT t.id"))return {rows:[{id:"team-1"}]};
  if(statement.includes("INSERT INTO public.smn_registry_item\n"))throw Error("database-error");
  return {rows:[]};
 }} as unknown as Client;
 await assert.rejects(()=>createRegistryItem(fake,"actor-1",{...base,type:"dependency"}));
 assert.equal(sql.at(-1),"ROLLBACK");
});
test("saisie invalide: aucune requete SQL",async()=>{
 const fake={query:()=>{throw Error("unexpected database access");}} as unknown as Client;
 const r=await createRegistryItem(fake,"actor-1",{...base,type:"risk",title:"  "});
 assert.deepEqual(r,{ok:false,error:"invalid-input"});
});
