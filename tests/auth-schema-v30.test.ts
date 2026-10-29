import assert from "node:assert/strict";
import {test} from "node:test";
import {assertMultiTeamMigrationValid,isSupportedAuthenticationSchemaVersion} from "../src/server/accounts/migration";

test("authentification accepte les schémas installés v28 à v32, jamais v33",()=>{
 for(const version of [28,29,30,31,32]){
  assert.equal(isSupportedAuthenticationSchemaVersion(version),true);
  assert.doesNotThrow(()=>assertMultiTeamMigrationValid(version,true,true));
  assert.throws(()=>assertMultiTeamMigrationValid(version,false,true),/smn-schema-incompatible/);
  assert.throws(()=>assertMultiTeamMigrationValid(version,true,false),/smn-schema-incompatible/);
 }
 assert.equal(isSupportedAuthenticationSchemaVersion(33),false);
});
