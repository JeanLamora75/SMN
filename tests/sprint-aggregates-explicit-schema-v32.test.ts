import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const services=["creation.ts","goals.ts","historical-actual-capacity.ts","historical-capacity.ts","historical-create.ts","historical-partial.ts","review-analysis.ts","sprint-scores.ts","story-points.ts","closure.ts","historical-events.ts","wizard.ts","transitions.ts","ticket-counts.ts","deletion.ts"];
test("Sprint: huit services d'agrégats sans DDL à l'exécution",()=>{
 for(const name of services){
  const src=read("src/server/sprints/"+name);
  assert.doesNotMatch(src,/\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX)\b/i,name);
  assert.match(src,/(?:sprint-schema-not-ready|sprint-core-schema-not-ready)/,name);
 }
});
test("Sprint: migration explicite, additive et transactionnelle",()=>{
 const src=read("scripts/apply-sprint-aggregates-v32.ts");
 for(const name of ["smn_sprint_goal","smn_sprint_historical_capacity","smn_sprint_historical_actual_capacity","smn_sprint_scores","smn_sprint_story_points","smn_sprint_review_analysis"]){
  assert.ok(src.includes(name),name);
 }
 assert.match(src,/pg_advisory_xact_lock/);
 assert.match(src,/ROLLBACK/);
 assert.match(src,/schema_version!==32/);
 assert.doesNotMatch(src,/\b(?:DROP TABLE|TRUNCATE TABLE|DELETE FROM)\b/i);
});

test("Sprint: déploiement v32 atomique des tables centrales et des agrégats",()=>{
 const script=read("scripts/apply-sprint-schema-v32.ts");
 assert.match(script,/sprintCoreStatements/);
 assert.match(script,/sprintAggregateStatements/);
 assert.match(script,/pg_advisory_xact_lock/);
 assert.match(script,/ROLLBACK/);
 assert.match(script,/COMMIT/);
 assert.match(script,/smn_sprint_exceptional_meeting/);
 assert.doesNotMatch(script,/\b(?:DROP TABLE|TRUNCATE TABLE|DELETE FROM)\b/i);
});
