import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
const source=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("création : route Admin, origine sécurisée, verrou global avant BD",()=>{
 const s=source("src/app/api/admin/team-meetings/route.ts");
 assert.match(s,/export async function POST/);
 assert.match(s,/authorizeApi\(request,"write",resource\)/);
 assert.match(s,/actor\.role!=="admin"/);
 assert.ok(s.indexOf("if(!MULTI_TEAM_CONTEXT_READY)")<
  s.indexOf("withAuthDb(db=>createTeamMeeting"));
 assert.doesNotMatch(s,/export async function GET|export async function DELETE/);
});
test("modifications : PATCH distinct, Admin et même verrou global",()=>{
 const s=source("src/app/api/admin/team-meetings/change/route.ts");
 assert.match(s,/export async function PATCH/);
 assert.match(s,/actor\.role!=="admin"/);
 assert.ok(s.indexOf("if(!MULTI_TEAM_CONTEXT_READY)")<
  s.indexOf("withAuthDb(db=>changeTeamMeeting"));
 assert.doesNotMatch(s,/export async function GET|export async function DELETE/);
});
test("service de création : tables allowlistées et aucun DDL en v28",()=>{
 const s=source("src/server/teams/meeting-create.ts");
 assert.match(s,/resolveAdminTeam\(db,actor,input\.teamId\)/);
 assert.match(s,/p.team_id=\$2/);
 assert.match(s,/s.team_id=\$2/);
 assert.match(s,/FOR UPDATE OF s/);
 assert.match(s,/FOR UPDATE OF p/);
 assert.match(s,/smn_sprint_exceptional_meeting_history/);
 assert.match(s,/smn_kanban_period_audit/);
 assert.doesNotMatch(s,/CREATE TABLE|ALTER TABLE|DROP TABLE/i);
});
test("service modification : période verrouillée, CAS, annulation et audit",()=>{
 const s=source("src/server/teams/meeting-change.ts");
 assert.match(s,/FOR UPDATE OF m,c/);
 assert.match(s,/starts_at=\$6::timestamptz/);
 assert.match(s,/ends_at=\$7::timestamptz/);
 assert.match(s,/status='scheduled'/);
 assert.match(s,/input\.action==="cancel"\?"cancelled"/);
 assert.match(s,/smn_sprint_exceptional_meeting_history/);
 assert.match(s,/smn_kanban_period_audit/);
 assert.doesNotMatch(s,/DELETE FROM public\.smn_(sprint_exceptional_meeting|kanban_meeting)/);
});
test("anciens détails de réunions restent fermés en v28",()=>{
 const previous=[
  "src/app/api/admin/kanban-meetings/route.ts",
  "src/app/api/team-calendar/meetings/[kind]/[id]/route.ts",
  "src/app/api/team-calendar/meetings/[kind]/[id]/outcomes/route.ts"
 ];
 for(const p of previous)assert.match(source(p),/withLegacyTeamApi\(/);
 assert.match(source("src/lib/team-context-readiness.ts"),
  /MULTI_TEAM_CONTEXT_READY:boolean=false/);
});
