import {canAccess} from "../src/server/access-policy";
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

test("catalogue visible en lecture aux comptes autorisés, gestion admin seulement",()=>{
 const resource={type:"companies",exists:true,inScope:true};
 const user={role:"user",is_active:true,must_change_password:false};
 const admin={role:"admin",is_active:true,must_change_password:false};
 assert.equal(canAccess(user,"read",resource),true);
 assert.equal(canAccess(user,"write",resource),false);
 assert.equal(canAccess(admin,"write",resource),true);
 assert.equal(canAccess({...user,is_active:false},"read",resource),false);
 assert.equal(canAccess(user,"read",{...resource,inScope:false}),false);
});
test("payload d'édition interdit les champs supplémentaires",()=>{
 assert.equal(parseCompanyInput({name:"Acme",color:"blue",companyId:"other"}),null);
 assert.equal(parseCompanyInput({name:"Acme",color:"blue",comment:"a".repeat(2001)}),null);
});
