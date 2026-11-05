import assert from "node:assert/strict";
import {test} from "node:test";
import {isSupportedAuthenticationSchemaVersion} from "../src/server/accounts/migration";
import {nativeV33BaselineSql} from "../src/server/installation/native-v33";
import {evaluateSchemaCapability,CURRENT_SCHEMA_VERSION} from "../src/server/schema/compatibility";

test("v33 auth: the current schema is accepted while invalid and future schemas fail closed",()=>{
 assert.equal(CURRENT_SCHEMA_VERSION,33);
 assert.equal(isSupportedAuthenticationSchemaVersion(CURRENT_SCHEMA_VERSION),true);
 for(const value of [0,-1,34,99,1.5,Number.NaN,Infinity])
  assert.equal(isSupportedAuthenticationSchemaVersion(value),false,String(value));
 for(const capability of ["multi-team","per-team-agile-mode","company-catalog","links"] as const){
  assert.equal(evaluateSchemaCapability(33,capability).ok,true);
  assert.equal(evaluateSchemaCapability(34,capability).ok,false);
 }
});

test("v33 auth: canonical schema declares account and team security columns",()=>{
 const sql=nativeV33BaselineSql();
 assert.ok(sql,"Canonical v33 schema must be present");
 const account=sql.match(/CREATE TABLE "public"\."smn_account" \(([\s\S]*?)\n\);/);
 assert.ok(account,"smn_account table");
 for(const field of ["id","installation_id","role","password_hash","must_change_password","is_active"])
  assert.match(account[1],new RegExp('"'+field+'"'),field);
 const teams=sql.match(/CREATE TABLE "public"\."smn_team" \(([\s\S]*?)\n\);/);
 assert.ok(teams,"smn_team table");
 assert.match(teams[1],/"installation_id"/);
 assert.match(teams[1],/"agile_mode"/);
});
