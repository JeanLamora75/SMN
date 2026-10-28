import assert from "node:assert/strict";
import test from "node:test";
import {parseCompanyInput} from "../src/server/companies/catalog";

test("company input normalizes name and optional comment",()=>{
 assert.deepEqual(parseCompanyInput({name:"  ACME  France ",color:"blue"}),{name:"ACME France",comment:null,color:"blue"});
});
test("company rejects invalid color and name",()=>{
 assert.equal(parseCompanyInput({name:"",color:"blue"}),null);
 assert.equal(parseCompanyInput({name:"ACME",color:"unsafe"}),null);
});
test("company rejects unexpected data and invalid comments",()=>{
 assert.equal(parseCompanyInput({name:"ACME",color:"blue",installation_id:"other"}),null);
 assert.equal(parseCompanyInput({name:"ACME",color:"blue",comment:3}),null);
});
