import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";

const source=(name:string)=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
test("nouvelle API : seule la mutation POST Admin et origine locale est exposée",()=>{
 const route=source("src/app/api/admin/members/[id]/team-assignment/route.ts");
 assert.match(route,/export async function POST/);
 assert.doesNotMatch(route,/export async function GET|export async function PUT|export async function PATCH/);
 assert.match(route,/authorizeApi\(request,"write",resource\)/);
 assert.match(route,/actor\.role!=="admin"/);
 assert.match(route,/readJsonObject\(request,4096\)/);
});
test("verrou global dans la route avant toute transaction",()=>{
 const route=source("src/app/api/admin/members/[id]/team-assignment/route.ts");
 const gate=route.indexOf("if(!MULTI_TEAM_CONTEXT_READY)");
 const db=route.indexOf("withAuthDb(db=>saveTeamAssignmentRevision");
 assert.ok(gate>0&&db>gate);
 assert.match(source("src/lib/team-context-readiness.ts"),
  /SMN_MULTI_TEAM_PILOT_ACK==="I_ACCEPT_UNVERIFIED_ISOLATION"/);
});
test("ancienne API affectation reste refusée en v28",()=>{
 const old=source("src/app/api/admin/members/[id]/assignment/route.ts");
 assert.match(old,/withLegacyMemberApi\(/);
 assert.doesNotMatch(old,/withAuthDb\(/);
});
test("service atomique : compte et équipe, verrouillage et uniquement append-only",()=>{
 const service=source("src/server/members/team-assignment-write.ts");
 assert.match(service,/resolveAdminTeam\(db,actor,input\.teamId\)/);
 assert.match(service,/FOR UPDATE OF m/);
 assert.match(service,/FOR UPDATE OF a/);
 assert.match(service,/WHERE a\.member_id=\$1 AND a\.team_id=\$2 AND a\.end_on IS NULL/);
 assert.match(service,/INSERT INTO public\.smn_member_assignment_version/);
 assert.doesNotMatch(service,/DELETE FROM public\.smn_member_assignment_version/);
 assert.doesNotMatch(service,/UPDATE public\.smn_member_assignment_version/);
 assert.doesNotMatch(service,/INSERT INTO public\.smn_member_assignment\s*\(/);
});
