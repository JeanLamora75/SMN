import test from "node:test";
import assert from "node:assert/strict";
import {canAccess} from "../src/server/access-policy";
test("authenticated user can download only explicitly permitted archived PDF",()=>{
 const actor={role:"user",is_active:true,must_change_password:false};
 assert.equal(canAccess(actor,"download",{type:"documents",exists:true,inScope:true,format:"PDF",userAuthorized:true}),true);
 assert.equal(canAccess(actor,"download",{type:"documents",exists:true,inScope:true,format:"PDF",userAuthorized:false}),false);
 assert.equal(canAccess(actor,"generate",{type:"documents",exists:true,inScope:true,collection:true}),false);
});
test("anonymous requests cannot download PDF",()=>{
 assert.equal(canAccess(null,"download",{type:"documents",exists:true,inScope:true,format:"PDF",userAuthorized:true}),false);
});
