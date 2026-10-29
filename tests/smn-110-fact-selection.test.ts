import test from "node:test";
import assert from "node:assert/strict";
import {selectableFact,updateFactSelection} from "../src/server/registries/fact-selection";
import type {Client} from "pg";
test("faits masqués ou invalidés exclus de la présélection",()=>{
 assert.equal(selectableFact(false,false),true);
 assert.equal(selectableFact(true,false),false);
 assert.equal(selectableFact(false,true),false);
});
test("entrée erronée refusée sans écriture",async()=>{
 const r=await updateFactSelection({} as Client,"admin",{origin:"manual",factId:"bad",revision:0,hidden:false,promoted:true,selected:true});
 assert.deepEqual(r,{ok:false,error:"invalid-input"});
});
test("sélection transactionnelle avec audit, sans modifier les sources",async()=>{
 const calls:string[]=[];
 const db={query:async(q:string)=>{calls.push(q);if(q.startsWith("SELECT to_regclass(")&&q.endsWith(" AS present"))return {rows:[{present:"migrated"}]};
  if(q.includes("SELECT r.id FROM public.smn_registry_item"))return {rows:[{id:"ok"}]};
  return {rows:[]};
 }} as unknown as Client;
 const r=await updateFactSelection(db,"admin",{origin:"manual",factId:"11111111-1111-4111-8111-111111111111",revision:0,hidden:true,promoted:true,selected:true});
 assert.equal(r.ok,true);
 assert.equal(calls.at(-1),"COMMIT");
 assert.ok(calls.some(q=>q.includes("smn_fact_selection_audit")));
 assert.ok(!calls.some(q=>q.includes("UPDATE public.smn_registry_item")));
});
