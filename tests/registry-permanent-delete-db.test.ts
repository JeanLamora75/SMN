import assert from "node:assert/strict";
import {test} from "node:test";
import type {Client} from "pg";
import {deleteRegistryItem} from "../src/server/registries/delete-item";

const id="3f2c7a29-2345-4567-8b9c-123456789abc";
const teamId="4f2c7a29-2345-4567-8b9c-123456789abc";
type RecordCall={sql:string;params?:unknown[]};
function fakeDb(options:{revision?:number;missing?:boolean;failOn?:string}={}){
 const calls:RecordCall[]=[];
 const db={query:async(sql:string,params?:unknown[])=>{
  calls.push({sql,params});
  if(options.failOn&&sql.includes(options.failOn))
   throw Object.assign(Error("referenced row"),{code:"23503"});
  if(sql.includes("SELECT r.revision"))return {rows:options.missing?[]:[{revision:options.revision??3}]};
  if(sql.includes("SELECT table_name AS name"))return {rows:[]};
  if(sql.includes("DELETE FROM public.smn_registry_item WHERE"))return {rowCount:1,rows:[{id}]};
  return {rows:[],rowCount:1};
 }} as unknown as Client;
 return {db,calls};
}
test("suppression réussie : une transaction, suppression cible et COMMIT",async()=>{
 const {db,calls}=fakeDb();
 const result=await deleteRegistryItem(db,id,teamId,3);
 assert.deepEqual(result,{ok:true});
 assert.equal(calls[0].sql,"BEGIN");
 assert.equal(calls.at(-1)?.sql,"COMMIT");
 const main=calls.find(call=>call.sql.includes("DELETE FROM public.smn_registry_item WHERE"));
 assert.deepEqual(main?.params,[id,teamId]);
 assert(calls.some(call=>call.sql.includes("smn_registry_comment_revision")));
 assert(calls.some(call=>call.sql.includes("target_kind='record'")));
});
test("révision périmée : aucune donnée effacée et ROLLBACK",async()=>{
 const {db,calls}=fakeDb({revision:4});
 assert.deepEqual(await deleteRegistryItem(db,id,teamId,3),{ok:false,error:"conflict"});
 assert.equal(calls.at(-1)?.sql,"ROLLBACK");
 assert(!calls.some(call=>call.sql.startsWith("DELETE FROM")));
});
test("fiche inaccessible : refus neutre et ROLLBACK",async()=>{
 const {db,calls}=fakeDb({missing:true});
 assert.deepEqual(await deleteRegistryItem(db,id,teamId,3),{ok:false,error:"not-found"});
 assert.equal(calls.at(-1)?.sql,"ROLLBACK");
});
test("nouvelle contrainte FK : aucune suppression partielle validée",async()=>{
 const {db,calls}=fakeDb({failOn:"smn_registry_item_audit"});
 assert.deepEqual(await deleteRegistryItem(db,id,teamId,3),{ok:false,error:"linked-data"});
 assert.equal(calls.at(-1)?.sql,"ROLLBACK");
 assert(!calls.some(call=>call.sql==="COMMIT"));
});
test("entrée invalide : pas de transaction",async()=>{
 const {db,calls}=fakeDb();
 assert.deepEqual(await deleteRegistryItem(db,"invalid",teamId,3),{ok:false,error:"invalid-input"});
 assert.deepEqual(calls,[]);
});

test("team identifier follows multi-team contract rather than UUID-only restriction",async()=>{
 const legacyTeam="team_myincident_01";
 const {db,calls}=fakeDb();
 assert.deepEqual(await deleteRegistryItem(db,id,legacyTeam,3),{ok:true});
 assert.deepEqual(calls.find(call=>call.sql.includes("DELETE FROM public.smn_registry_item WHERE"))?.params,[id,legacyTeam]);
 for(const invalidTeam of ["","../other","invalid team","a".repeat(81)]){
  const other=fakeDb();
  assert.deepEqual(await deleteRegistryItem(other.db,id,invalidTeam,3),{ok:false,error:"invalid-input"});
  assert.equal(other.calls.length,0);
 }
});
