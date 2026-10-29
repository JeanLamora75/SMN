import assert from "node:assert/strict";
import {test} from "node:test";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import type {Client} from "pg";
import {assessSchemaIntegrity,inspectSchemaCapability} from "../src/server/schema/integrity";

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

test("checksum de migration invalide refuse l'accès",()=>{
 const result=assessSchemaIntegrity("per-team-agile-mode",32,{...valid,migrationChecksum:"invalid"});
 assert.equal(result.ok,false);
 if(!result.ok)assert.deepEqual(result.details,["checksum:20261029_smn_team_agile_mode_v32"]);
});

test("sondage PostgreSQL est exclusivement en lecture et détecte une colonne manquante",async()=>{
 const sql=readFileSync(new URL("../prisma/migrations/20261029_smn_team_agile_mode_v32/migration.sql",import.meta.url),"utf8");
 const queries:string[]=[];
 const db={query:async(query:string)=>{
  queries.push(query);
  if(query.includes("FROM public.smn_installation"))return {rows:[{schema_version:32,state:"initialized"}]};
  if(query.includes("FROM public._prisma_migrations"))return {rows:[{migration_name:valid.migrations[0],checksum:createHash("sha256").update(sql).digest("hex")}]};
  if(query.includes("pg_catalog.pg_class"))return {rows:[{name:"smn_team"}]};
  if(query.includes("information_schema.columns"))return {rows:[{name:"smn_team:agile_mode"}]};
  if(query.includes("pg_catalog.pg_constraint"))return {rows:[{name:"smn_team_agile_mode_check"}]};
  throw Error("Unexpected SQL");
 }} as unknown as Pick<Client,"query">;
 const result=await inspectSchemaCapability(db,"per-team-agile-mode");
 assert.equal(result.ok,false);
 if(!result.ok)assert.deepEqual(result.details,["column:smn_team:is_archived"]);
 assert.equal(queries.length,5);
 assert.ok(queries.every(q=>/^\s*SELECT\b/i.test(q)));
});
