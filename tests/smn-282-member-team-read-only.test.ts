import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {translate} from "../src/i18n/catalog";

const source=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("page v28 : isolation Admin et appartenance membre-équipe vérifiées au serveur",()=>{
 const page=source("src/app/app/admin/members/[id]/page.tsx");
 assert.match(page,/schema<28\|\|schema>32\|\|actor\.role!=="admin"/);
 assert.match(page,/resolveAdminTeam\(db/);
 assert.match(page,/readTeamAssignmentHistory\(db/);
 assert.match(page,/a.member_id=m.id AND a.team_id=\$2/);
 assert.match(page,/t.installation_id=m.installation_id/);
 assert.match(page,/context.kind==="team"\?<MemberTeamReadOnly/);
 assert.match(page,/if\(context.kind==="legacy"\)/);
 assert.match(page,/catch\{return \{kind:"missing"\}/);
});
test("les liens cartes et liste transmettent l'équipe de la liste affichée",()=>{
 const listing=source("src/app/app/admin/members/team-overview.tsx");
 assert.match(listing,/new URLSearchParams\(\{teamId:roster\.team\.id\}\)/);
 assert.match(listing,/href=\{memberHref\(member\)\}/);
 assert.equal(listing.split("router.push(memberHref(member))").length-1,2);
});
test("vue membre v28 : pas d'éditeur, pas de mutation HTTP et purge des requêtes obsolètes",()=>{
 const view=source("src/app/app/admin/members/[id]/member-team-read-only.tsx");
 assert.match(view,/type="month"/);
 assert.match(view,/controller\.abort\(\)/);
 assert.match(view,/result\.teamId!==teamId/);
 assert.match(view,/team-availability\?/);
 assert.match(view,/MemberAbsenceEditor|AssignmentEditor/);
 assert.doesNotMatch(view,/method:"POST"|method:"PATCH"|method:"DELETE"/);
});
test("i18n : clés FR et EN identiques et toutes affichables",()=>{
 const fr=JSON.parse(source("src/i18n/member-team-scope.fr.json"));
 const en=JSON.parse(source("src/i18n/member-team-scope.en.json"));
 assert.deepEqual(Object.keys(fr.memberTeamScope).sort(),Object.keys(en.memberTeamScope).sort());
 for(const key of Object.keys(fr.memberTeamScope)){
  const translationKey=("memberTeamScope."+key) as Parameters<typeof translate>[1];
  assert.equal(translate("fr",translationKey),fr.memberTeamScope[key]);
  assert.equal(translate("en",translationKey),en.memberTeamScope[key]);
 }
});
test("anciens historiques et absences restent interdits en v28",()=>{
 for(const path of [
  "src/app/api/admin/members/[id]/history/route.ts",
  "src/app/api/admin/members/[id]/absences/route.ts"
 ]){
  assert.match(source(path),/withLegacyMemberApi\(/);
 }
 assert.match(source("src/lib/team-context-readiness.ts"),/SMN_MULTI_TEAM_PILOT_ACK==="I_ACCEPT_UNVERIFIED_ISOLATION"/);
});
