import {test} from "node:test";
import assert from "node:assert/strict";
import {SessionStore} from "../src/server/auth/session-store";
test("SMN-34 offline activation invalidates every existing identity session",()=>{
 const store=new SessionStore();
 const a=store.issue("old-admin","old-secret-fingerprint",1_000,"admin");
 const b=store.issue("old-user","old-secret-fingerprint",1_000,"user");
 assert.ok(store.get(a,1_100));
 assert.ok(store.get(b,1_100));
 assert.equal(store.revokeAll(),2);
 assert.equal(store.get(a,1_100),null);
 assert.equal(store.get(b,1_100),null);
 assert.equal(store.revokeAll(),0);
 const renewed=store.issue("new-admin","new-secret-fingerprint",2_000,"admin");
 assert.ok(store.get(renewed,2_100));
});
