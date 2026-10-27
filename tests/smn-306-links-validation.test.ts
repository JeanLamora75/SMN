import assert from "node:assert/strict";
import test from "node:test";
import {normalizeLink,LinkError} from "../src/server/links/validation";

const basic={title:"Documentation",url:"https://example.org/docs",categoryId:"cat_1",scope:"TRANSVERSE",teamId:null};
test("accepts HTTP(S), duplicate URLs and trims title",()=>{
 const a=normalizeLink({...basic,title:"  Documentation  "});
 assert.equal(a.title,"Documentation");
 assert.equal(a.url,"https://example.org/docs");
 assert.equal(normalizeLink({...basic,url:"http://example.org"}).url,"http://example.org");
 assert.equal(normalizeLink(basic).url,normalizeLink(basic).url);
});
test("rejects unsafe URL schemes, credentials and malformed URLs",()=>{
 for(const url of ["javascript:alert(1)","file:///tmp/x","data:text/html,a","ftp://example.org",
  "https://a:b@example.org","https://","https://example.org/\ninvalid"]){
  assert.throws(()=>normalizeLink({...basic,url}),LinkError,url);
 }
});
test("enforces scope and team invariants",()=>{
 assert.throws(()=>normalizeLink({...basic,scope:"EQUIPE",teamId:null}),LinkError);
 assert.throws(()=>normalizeLink({...basic,scope:"TRANSVERSE",teamId:"team_1"}),LinkError);
 assert.equal(normalizeLink({...basic,scope:"EQUIPE",teamId:"team_1"}).teamId,"team_1");
});
test("rejects blank required fields and overlong description",()=>{
 for(const update of [{title:"  "},{categoryId:""},{description:"x".repeat(4001)},{url:""}])
  assert.throws(()=>normalizeLink({...basic,...update}),LinkError);
});

test("rejects ambiguous external URL normalization and unsupported input",()=>{
 for(const url of ["https://example.org\\\\@evil.test/","https://example.org/a b",
  "https://example.org/\\tpath","https://example.org/é space"]){
  assert.throws(()=>normalizeLink({...basic,url}),LinkError,url);
 }
 assert.throws(()=>normalizeLink({...basic,scope:"EQUIPE",teamId:"../other"}),LinkError);
 assert.throws(()=>normalizeLink({...basic,categoryId:"../other"}),LinkError);
});
