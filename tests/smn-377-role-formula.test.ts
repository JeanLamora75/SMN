import {test} from "node:test";
import assert from "node:assert/strict";
import {parseFormula,referencedTags,evaluateFormula,FormulaSyntaxError,type RoleCapacityResolver} from "../src/server/indicators/formula";

const resolver:RoleCapacityResolver=(name,role)=>{
 assert.equal(role,"DEVELOPER");
 const values={ROLE_MAX_JH:"25",ROLE_JH_PLANNED:"22",ROLE_JH:"19"};
 return {kind:"available",value:values[name]};
};

test("role functions parse quoted roles without adding indicator dependencies",()=>{
 assert.deepEqual(referencedTags(parseFormula('ROLE_MAX_JH("DEVELOPER") + FOCUS')),[ "FOCUS" ]);
 for(const role of ["DEVELOPER","SCRUM_MASTER","PRODUCT_OWNER"]){
  assert.equal(parseFormula('ROLE_JH("'+role+'")').kind,"role");
 }
});

test("role capacity expressions compose with arithmetic and percent",()=>{
 const ast=parseFormula('ROUND((ROLE_JH_PLANNED("DEVELOPER")-ROLE_JH("DEVELOPER"))/ROLE_JH_PLANNED("DEVELOPER")*100,2)');
 assert.deepEqual(evaluateFormula(ast,{},1000,undefined,resolver),{kind:"available",value:"13.64"});
 assert.deepEqual(evaluateFormula(parseFormula('ROLE_MAX_JH("DEVELOPER")-ROLE_JH_PLANNED("DEVELOPER")'),{},1000,undefined,resolver),{kind:"available",value:"3"});
});
test("invalid role parameters are rejected and missing resolver fails closed",()=>{
 for(const expression of ['ROLE_JH(DEVELOPER)','ROLE_JH("UNKNOWN")','ROLE_JH("DEVELOPER",1)','ROLE_MAX_JH(3)'])
  assert.throws(()=>parseFormula(expression),FormulaSyntaxError);
 assert.deepEqual(evaluateFormula(parseFormula('ROLE_JH("DEVELOPER")'),{}),{kind:"unavailable",reason:"missing_source",sourceTag:"DEVELOPER"});
});
