import test from "node:test";
import assert from "node:assert/strict";
import {criticality,validLevel} from "../src/lib/risk-criticality";
test("matrice fixe 3x3 de neuf cas",()=>{
 const expected=[["low","low","medium"],["low","medium","high"],["medium","high","high"]];
 for(let p=1;p<=3;p++)for(let i=1;i<=3;i++){
  const result=criticality(p as 1|2|3,i as 1|2|3);
  assert.equal(result.score,p*i);assert.equal(result.level,expected[p-1][i-1]);
 }
});
test("absence explicite et niveaux stricts",()=>{
 assert.deepEqual(criticality(null,3),{score:null,level:"unassessed"});
 assert.deepEqual(criticality(3,null),{score:null,level:"unassessed"});
 assert.equal(validLevel(0),false);assert.equal(validLevel(3),true);
});
