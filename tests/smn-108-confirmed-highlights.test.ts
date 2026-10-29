import test from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {readFileSync} from "node:fs";
import {recordConfirmedHighlight} from "../src/server/registries/confirmed-highlights";
test("catégorie désactivée : aucune création automatique",async()=>{
 const commands:string[]=[];
 const db={query:async(sql:string)=>{commands.push(sql);if(sql.startsWith("SELECT to_regclass(")&&sql.endsWith(" AS present"))return {rows:[{present:"migrated"}]};
  if(sql.includes("to_regclass"))return {rows:[{present:false}]};
  return {rows:[]};
 }} as unknown as Client;
 const done=await recordConfirmedHighlight(db,{category:"satisfiedDependency",sourceKind:"registry",
 sourceId:"11111111-1111-4111-8111-111111111111",sourceRevision:1,title:"X",actorId:"admin"});
 assert.equal(done,false);
 assert.ok(!commands.some(x=>x.includes("INSERT INTO public.smn_automatic_highlight")));
});
test("événement confirmé : insertion idempotente par catégorie/source/révision",async()=>{
 const sql:string[]=[];
 const db={query:async(q:string)=>{sql.push(q);if(q.startsWith("SELECT to_regclass(")&&q.endsWith(" AS present"))return {rows:[{present:"migrated"}]};
  if(q.includes("to_regclass"))return {rows:[{present:false}]};
  if(q.includes("RETURNING id"))return {rows:[{id:"created"}]};
  return {rows:[]};
 }} as unknown as Client;
 assert.equal(await recordConfirmedHighlight(db,{category:"recordedDecision",sourceKind:"registry",
 sourceId:"11111111-1111-4111-8111-111111111111",sourceRevision:1,title:"Decision",actorId:"admin"}),true);
 assert.match(readFileSync(new URL("../scripts/apply-registry-extensions-v32.ts",import.meta.url),"utf8"),/UNIQUE\(category,source_kind,source_id,source_revision\)/);
 assert.ok(sql.some(x=>x.includes("ON CONFLICT DO NOTHING")));
});
