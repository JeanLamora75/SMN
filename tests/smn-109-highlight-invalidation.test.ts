import test from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {invalidateHighlight} from "../src/server/registries/highlight-invalidation";
const id="11111111-1111-4111-8111-111111111111";
test("invalidations demandent un motif et un identifiant valide",async()=>{
 const r=await invalidateHighlight({} as Client,"admin",id," ");
 assert.deepEqual(r,{ok:false,error:"invalid-input"});
});
test("invalidation conserve le fait et sa provenance",async()=>{
 const statements:string[]=[];
 const db={query:async(sql:string)=>{statements.push(sql);
  if(sql.includes("information_schema.columns"))return {rows:[{exists:true}]};
  if(sql.includes("to_regclass"))return {rows:[{exists:true}]};
  if(sql.includes("SELECT h.id,h.invalidated_at"))return {rows:[{id,invalidated_at:null}]};
  return {rows:[]};
 }} as unknown as Client;
 assert.deepEqual(await invalidateHighlight(db,"admin",id,"Saisie incorrecte"),{ok:true});
 assert.ok(statements.some(sql=>sql.includes("invalidated_at=now()")));
 assert.ok(!statements.some(sql=>sql.includes("DELETE FROM public.smn_automatic_highlight")));
 assert.equal(statements.at(-1),"COMMIT");
});
test("un fait déjà invalidé ne peut pas être réinvalidé",async()=>{
 const statements:string[]=[];
 const db={query:async(sql:string)=>{statements.push(sql);
  if(sql.includes("information_schema.columns"))return {rows:[{exists:true}]};
  if(sql.includes("to_regclass"))return {rows:[{exists:true}]};
  if(sql.includes("SELECT h.id,h.invalidated_at"))return {rows:[{id,invalidated_at:"2026-10-23"}]};
  return {rows:[]};
 }} as unknown as Client;
 assert.deepEqual(await invalidateHighlight(db,"admin",id,"Correction"),{ok:false,error:"conflict"});
 assert.equal(statements.at(-1),"ROLLBACK");
});
