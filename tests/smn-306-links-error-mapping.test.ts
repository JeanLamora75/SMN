import assert from "node:assert/strict";
import test from "node:test";
import {LinkError,mapLinkError} from "../src/server/links/validation";

test("link API errors map to stable HTTP statuses",()=>{
 const cases=[
  ["invalid-input",400],["forbidden",403],["not-found",404],
  ["conflict",409],["not-ready",503]
 ] as const;
 for(const [kind,status] of cases)assert.deepEqual(mapLinkError(new LinkError(kind)),{error:kind,status});
});
test("cross-team resolution never discloses a target team identifier",()=>{
 for(const message of ["team-access-forbidden","team-context-unavailable","team-id-invalid","team-context-not-ready"]){
  assert.deepEqual(mapLinkError(new Error(message)),{error:"not-found",status:404});
 }
});
test("database constraint errors have controlled HTTP responses",()=>{
 assert.deepEqual(mapLinkError({code:"23503"}),{error:"invalid-input",status:400});
 assert.deepEqual(mapLinkError({code:"23505"}),{error:"conflict",status:409});
 assert.deepEqual(mapLinkError(new Error("unexpected")),{error:"service-unavailable",status:503});
});
