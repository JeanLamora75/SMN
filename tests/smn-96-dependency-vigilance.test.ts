import test from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {dependencyActive,dependencyLate,writeDependencyFlag} from "../src/server/registries/dependency-vigilance";
test("seuls les états actifs déclenchent le retard",()=>{
 assert.equal(dependencyLate("open","2026-10-20","2026-10-23"),true);
 assert.equal(dependencyLate("in_progress","2026-10-20","2026-10-23"),true);
 assert.equal(dependencyLate("satisfied","2026-10-20","2026-10-23"),false);
 assert.equal(dependencyLate("cancelled","2026-10-20","2026-10-23"),false);
 assert.equal(dependencyLate("open",null,"2026-10-23"),false);
 assert.equal(dependencyActive("satisfied"),false);
});
test("le signal à risque ne modifie pas le statut de la dépendance",async()=>{
 const sql:string[]=[];
 const db={query:async(q:string)=>{sql.push(q);if(q.startsWith("SELECT to_regclass(")&&q.endsWith(" AS present"))return {rows:[{present:"migrated"}]};
  if(q.includes("SELECT r.id FROM public.smn_registry_item"))return {rows:[{id:"known"}]};
  return {rows:[]};
 }} as unknown as Client;
 const r=await writeDependencyFlag(db,"admin","11111111-1111-4111-8111-111111111111",{atRisk:true,revision:0});
 assert.deepEqual(r,{ok:true,atRisk:true,revision:1});
 assert.equal(sql.at(-1),"COMMIT");
 assert.ok(sql.some(q=>q.includes("INSERT INTO public.smn_dependency_vigilance_audit")));
 assert.ok(!sql.some(q=>q.includes("UPDATE public.smn_registry_item SET")));
});
