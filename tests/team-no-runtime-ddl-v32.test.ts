import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {test} from "node:test";
const root=new URL("../src/server/teams/",import.meta.url);
test("Équipes: aucun DDL dans les services métier, SQL uniquement dans migration.ts",()=>{
 for(const file of readdirSync(root).filter(n=>n.endsWith(".ts")&&n!=="migration.ts")){
  const source=readFileSync(new URL(file,root),"utf8");
  assert.doesNotMatch(source,/\b(?:CREATE|ALTER|DROP|TRUNCATE)\s+(?:TABLE|INDEX|VIEW|TYPE|SCHEMA)\b/i,file);
 }
});
test("Équipes: migrations v28 et v32 restent versionnées et la mutation exige le schéma",()=>{
 const write=readFileSync(new URL("../src/server/teams/write.ts",import.meta.url),"utf8");
 const runner=readFileSync(new URL("../scripts/apply-team-agile-mode-v32.ts",import.meta.url),"utf8");
 assert.match(write,/inspectSchemaCapability\(db,"per-team-agile-mode"\)/);
 assert.match(write,/smn_team_context_audit/);
 assert.match(runner,/pg_advisory_xact_lock/);
 assert.match(runner,/ROLLBACK/);
 assert.match(runner,/schema_version!==31/);
});
