import assert from "node:assert/strict";
import {test} from "node:test";
import {assessSchemaIntegrity} from "../src/server/schema/integrity";

const valid={
 tables:["smn_team"],
 columns:["smn_team:agile_mode","smn_team:is_archived"],
 constraints:["smn_team_agile_mode_check"],
 migrations:["20261029_smn_team_agile_mode_v32"]
};
test("migration v32 complète : capacité accordée",()=>{
 assert.deepEqual(assessSchemaIntegrity("per-team-agile-mode",32,valid),
  {ok:true,version:32,capability:"per-team-agile-mode"});
});
test("v31 refuse la capacité malgré des objets existants",()=>{
 const result=assessSchemaIntegrity("per-team-agile-mode",31,valid);
 assert.equal(result.ok,false);
});
test("migration non terminée bloque la capacité",()=>{
 const result=assessSchemaIntegrity("per-team-agile-mode",32,{...valid,migrations:[]});
 assert.equal(result.ok,false);
 if(!result.ok)assert.equal(result.reason,"migration-missing");
});
test("table, colonne ou contrainte manquante bloquent",()=>{
 for(const key of ["tables","columns","constraints"] as const){
  const result=assessSchemaIntegrity("per-team-agile-mode",32,{...valid,[key]:[]});
  assert.equal(result.ok,false);
  if(!result.ok)assert.equal(result.reason,"structure-incomplete");
 }
});
test("version future refusée même avec toutes les structures",()=>{
 const result=assessSchemaIntegrity("per-team-agile-mode",33,valid);
 assert.equal(result.ok,false);
});
