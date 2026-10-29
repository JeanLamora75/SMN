import assert from "node:assert/strict";
import {test} from "node:test";
import {CURRENT_SCHEMA_VERSION,evaluateSchemaCapability,assertSchemaCapability} from "../src/server/schema/compatibility";

test("refuse versions inconnues et futures",()=>{
 for(const v of [undefined,null,0,-1,3.5,"32",CURRENT_SCHEMA_VERSION+1]){
  assert.equal(evaluateSchemaCapability(v,"multi-team").ok,false);
 }
 assert.throws(()=>assertSchemaCapability(33,"multi-team"),/unsupported-version/);
});
test("capacités distinctes selon leur migration",()=>{
 assert.equal(evaluateSchemaCapability(27,"multi-team").ok,false);
 assert.equal(evaluateSchemaCapability(28,"multi-team").ok,true);
 assert.equal(evaluateSchemaCapability(31,"per-team-agile-mode").ok,false);
 assert.equal(evaluateSchemaCapability(32,"per-team-agile-mode").ok,true);
 assert.equal(evaluateSchemaCapability(30,"company-catalog").ok,false);
 assert.equal(evaluateSchemaCapability(31,"company-catalog").ok,true);
 assert.equal(evaluateSchemaCapability(29,"links").ok,true);
});
test("une version future ne se déclare jamais compatible",()=>{
 assert.equal(evaluateSchemaCapability(33,"per-team-agile-mode").ok,false);
});
