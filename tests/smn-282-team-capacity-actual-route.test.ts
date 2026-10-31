import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
const src=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("API historique : lecture v28 Admin filtrée par équipe et fermeture POST v28",()=>{
 const s=src("src/app/api/admin/capacity-actual/route.ts");
 assert.match(s,/resolveAdminTeam\(db,/);
 assert.match(s,/teamId:team\.team_id/);
 assert.match(s,/actor\.role!=="admin"/);
 assert.match(s,/v\.rows\[0\]\.schema_version>27/);
 assert.match(s,/query\.has\("teamId"\)/);
 assert.match(s,/capacity-write-pending-team-isolation/);
});
test("API nouvelle écriture : verrou côté serveur avant accès PostgreSQL",()=>{
 const s=src("src/app/api/admin/team-capacity-actual/route.ts");
 assert.match(s,/export async function POST/);
 assert.doesNotMatch(s,/export async function GET|export async function PUT/);
 assert.match(s,/actor\.role!=="admin"/);
 assert.match(s,/readJsonObject\(request,2048\)/);
 assert.ok(s.indexOf("if(!MULTI_TEAM_CONTEXT_READY)")<
  s.indexOf("withAuthDb(db=>saveTeamActualCapacity"));
 assert.match(src("src/lib/team-context-readiness.ts"),
  /SMN_MULTI_TEAM_PILOT_ACK==="I_ACCEPT_UNVERIFIED_ISOLATION"/);
});
test("service d'écriture : autorisation, verrous, revisions et audit",()=>{
 const s=src("src/server/capacity/team-actual-write.ts");
 assert.match(s,/parseActualChange\(raw\)/);
 assert.match(s,/resolveAdminTeam\(db,actor,teamId\)/);
 assert.match(s,/FOR UPDATE/);
 assert.match(s,/team_id=\$1 AND start_on=\$2::date AND end_on=\$3::date/);
 assert.match(s,/current\?\.closed_at\|\|current\?\.frozen_at/);
 assert.match(s,/previous\?\.revision\?\?0/);
 assert.match(s,/INSERT INTO public\.smn_capacity_actual_override_history/);
 assert.match(s,/ROLLBACK/);
 assert.doesNotMatch(s,/DELETE FROM public\.smn_capacity_actual_override/);
 assert.doesNotMatch(s,/UPDATE public\.smn_capacity_actual_snapshot/);
});
test("lecteur actuel v27 ne peut pas choisir une équipe arbitraire en v28",()=>{
 const s=src("src/server/capacity/actual.ts");
 assert.match(s,/i\.schema_version<=27/);
 assert.match(s,/i\.schema_version BETWEEN 28 AND 32 AND t\.id=\$1/);
 assert.match(s,/options\.teamId\?\{teamId:options\.teamId\}:\{\}/);
});
