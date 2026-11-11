import assert from "node:assert/strict";
import {test} from "node:test";
import {isManagedBackupId} from "../src/server/backup/operation-artifacts";

test("backup marker recognizes a valid v4 UUID",()=>{
 assert.equal(isManagedBackupId("1a591fe3-f9c2-478f-a3fa-fdd7bfe37fb5"),true);
 assert.equal(isManagedBackupId("734b7cb1-38ac-4261-87a8-f9393fdcc301"),true);
});
test("backup marker rejects invalid and sensitive values",()=>{
 for(const invalid of ["", "1a591fe3-f9c2-478f-a3fa-fdd7bfe37fb5-extra",
  "1a591fe3-f9c2-478f-a3fa-fdd7bfe37fb5/../../secret",
  "1a591fe3-f9c2-078f-a3fa-fdd7bfe37fb5", null,42,
  "postgresql://admin:secret@127.0.0.1/db"])
  assert.equal(isManagedBackupId(invalid),false);
});
