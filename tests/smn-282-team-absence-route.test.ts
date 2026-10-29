import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
const src=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("nouvelle route POST verrouillée : pas de lecture ni mutation avant validation",()=>{
 const route=src("src/app/api/admin/members/[id]/team-absence/route.ts");
 assert.match(route,/export async function POST/);
 assert.match(route,/export async function GET/);
 assert.doesNotMatch(route,/export async function PUT|export async function DELETE/);
 assert.match(route,/resolveAdminTeam\(db,\{accountId:actor\.id,role:"admin"\},teamId\)/);
 assert.match(route,/a\.start_on<=\$3::date AND \(a\.end_on IS NULL OR a\.end_on>=\$3::date\)/);
 assert.match(route,/authorizeApi\(request,"write",resource\)/);
 assert.match(route,/actor\.role!=="admin"/);
 assert.match(route,/readJsonObject\(request,4096\)/);
 assert.ok(route.indexOf("if(!MULTI_TEAM_CONTEXT_READY)")<
   route.indexOf("withAuthDb(db=>saveMemberAbsence"));
 assert.match(src("src/lib/team-context-readiness.ts"),
   /MULTI_TEAM_CONTEXT_READY:boolean=false/);
});
test("teamId de l'enveloppe uniquement ; ancienne route inchangée",()=>{
 const route=src("src/app/api/admin/members/[id]/team-absence/route.ts");
 assert.match(route,/Object\.keys\(body\)\.length!==2/);
 assert.match(route,/typeof body\.teamId!=="string"/);
 assert.match(route,/!Object\.hasOwn\(body,"change"\)/);
 assert.match(route,/body\.change,/);
 assert.match(route,/teamId:body\.teamId as string/);
 const old=src("src/app/api/admin/members/[id]/absences/route.ts");
 assert.match(old,/withLegacyMemberApi\(/);
 assert.doesNotMatch(old,/withAuthDb\(/);
});
test("l'ancienne validation, l'audit et le rejet des chevauchements sont conservés",()=>{
 const service=src("src/server/members/absence.ts");
 assert.match(service,/parseAbsenceChange\(raw\)/);
 assert.match(service,/overlapsAbsence/);
 assert.match(service,/INSERT INTO public\.smn_member_absence_history/);
 assert.match(service,/h\.after_values->>'deleted'='true'/);
 assert.match(service,/FOR UPDATE OF m/);
 assert.match(service,/FOR SHARE OF a/);
 assert.match(service,/resolveAdminTeam\(db,scope\.actor,scope\.teamId\)/);
 assert.match(service,/ownsEntirePeriod\(old\.start_on,old\.end_on\)/);
 assert.match(service,/ownsEntirePeriod\(input\.startOn,input\.endOn\)/);
 assert.match(service,/rows\.every\(a=>a\.team_id===authorized\.team_id\)/);
 assert.match(service,/a\.end_on IS NULL OR a\.end_on>=\$2::date/);
 assert.doesNotMatch(service,/DELETE FROM public\.smn_member_absence/);
});
