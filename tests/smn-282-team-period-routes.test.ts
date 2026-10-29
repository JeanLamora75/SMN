import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
const source=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("nouvelle réconciliation : route POST réservée Admin et verrouillée avant DB",()=>{
 const s=source("src/app/api/admin/team-periods/reconcile/route.ts");
 assert.match(s,/authorizeApi\(request,"write",resource\)/);
 assert.match(s,/actor\.role!=="admin"/);
 assert.match(s,/Object\.keys\(body\)\.length!==1/);
 assert.ok(s.indexOf("if(!MULTI_TEAM_CONTEXT_READY)")<
  s.indexOf("withAuthDb(db=>reconcileAuthorizedTeamPeriods"));
 assert.doesNotMatch(s,/export async function GET|export async function DELETE/);
});
test("Précontrôle : lecture seule et aucune permission de clôture",()=>{
 const route=source("src/app/api/admin/team-periods/closure-readiness/route.ts");
 const service=source("src/server/teams/closure-readiness.ts");
 assert.match(route,/export async function GET/);
 assert.doesNotMatch(route,/export async function POST/);
 assert.ok(route.indexOf("if(!MULTI_TEAM_CONTEXT_READY)")<
  route.indexOf("withAuthDb(db=>readTeamClosureReadiness"));
 assert.match(service,/snapshotPipelineQualified:false,canClose:false/);
 assert.doesNotMatch(service,/BEGIN|COMMIT|INSERT INTO|UPDATE public|CREATE TABLE/);
});
test("ancienne réconciliation Sprint/Kanban refuse v28 avant sa DDL",()=>{
 for(const p of ["src/server/sprints/transitions.ts",
  "src/server/kanban/states.ts"]){
  const s=source(p);
  assert.match(s,/await assertLegacyTeamApi\(db\)/);
  const reconcile=s.slice(s.indexOf("export async function reconcile"));
  assert.ok(reconcile.indexOf("await assertLegacyTeamApi(db)")<
   reconcile.indexOf("await ensure"));
 }
});
test("anciennes routes de clôtures, périodes et cérémonies toutes gardées",()=>{
 const paths=[
  "src/app/api/admin/sprints/closure/route.ts",
  "src/app/api/admin/sprints/states/route.ts",
  "src/app/api/admin/kanban-periods/[id]/closure/route.ts",
  "src/app/api/admin/kanban-periods/route.ts",
  "src/app/api/admin/sprints/ceremonies/route.ts",
  "src/app/api/admin/sprints/templates/route.ts",
  "src/app/api/admin/sprints/template-occurrences/route.ts"
 ];
 for(const p of paths){
  const s=source(p);
  assert.match(s,/withLegacyTeamApi\(/,p);
  assert.doesNotMatch(s,/withAuthDb\(/,p);
 }
 assert.match(source("src/lib/team-context-readiness.ts"),
  /SMN_MULTI_TEAM_PILOT_ACK==="I_ACCEPT_UNVERIFIED_ISOLATION"/);
});
test("Transition v28 : pas de DDL, ouverture historique sans capacité inventée",()=>{
 const s=source("src/server/teams/period-state.ts");
 assert.match(s,/resolveAdminTeam\(db,actor,requestedTeamId\)/);
 assert.match(s,/s\.team_id=\$1/);
 assert.match(s,/p\.team_id=\$1/);
 assert.match(s,/FOR UPDATE OF s/);
 assert.match(s,/FOR UPDATE OF p/);
 assert.match(s,/s\.opening_on_time/);
 assert.match(s,/provenance="historical-unavailable"/);
 assert.match(s,/initialJh:number\|null=null/);
 assert.doesNotMatch(s,/CREATE TABLE|ALTER TABLE|DROP TABLE/i);
});

test("Inventaire des cérémonies générées en v28 : Admin, GET seulement et verrou",()=>{
 const route=source("src/app/api/admin/team-ceremonies/route.ts");
 const service=source("src/server/teams/ceremonies-read.ts");
 assert.match(route,/export async function GET/);
 assert.doesNotMatch(route,/export async function POST|export async function PATCH/);
 assert.match(route,/actor\.role!=="admin"/);
 assert.ok(route.indexOf("if(!MULTI_TEAM_CONTEXT_READY)")<
  route.indexOf("withAuthDb(db=>readTeamCeremonies"));
 assert.match(service,/resolveAdminTeam\(db,actor,teamId\)/);
 assert.match(service,/s.team_id=\$2/g);
 assert.doesNotMatch(service,/CREATE TABLE|ALTER TABLE|INSERT INTO|UPDATE public/);
});
