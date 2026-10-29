import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("Membres: corrections d'affectation sans création SQL implicite",()=>{
 const service=read("src/server/members/assignment-start-correction.ts");
 const migration=read("scripts/apply-member-deferred-v32.ts");
 assert.doesNotMatch(service,/\bCREATE\s+TABLE\b/i);
 assert.match(service,/member-audit-schema-not-ready/);
 assert.match(migration,/CREATE TABLE IF NOT EXISTS public.smn_member_assignment_start_audit/);
 assert.match(migration,/ROLLBACK/);
 assert.match(migration,/schema_version!==32/);
});
test("Membres: contexte équipe couvert par la migration multiéquipes versionnée",()=>{
 const service=read("src/server/members/team-context.ts");
 const migration=read("src/server/teams/migration.ts");
 assert.doesNotMatch(service,/\b(?:CREATE|ALTER|DROP)\s+TABLE\b/i);
 assert.match(service,/member-team-context-schema-not-ready/);
 assert.match(migration,/CREATE TABLE IF NOT EXISTS public.smn_team_context/);
 assert.match(migration,/CREATE TABLE IF NOT EXISTS public.smn_team_context_audit/);
});
