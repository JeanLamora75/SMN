import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
const source=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

const reports=[
 "src/app/api/admin/reports/archives/[id]/download/route.ts",
 "src/app/api/admin/reports/archives/[id]/grants/route.ts",
 "src/app/api/admin/reports/archives/[id]/visibility/route.ts",
 "src/app/api/admin/reports/sprints/[id]/analysis-choices/route.ts",
 "src/app/api/admin/reports/sprints/[id]/apply-template/route.ts",
 "src/app/api/admin/reports/sprints/[id]/archives/route.ts",
 "src/app/api/admin/reports/sprints/[id]/content/route.ts",
 "src/app/api/admin/reports/sprints/[id]/documents/[documentId]/data/route.ts",
 "src/app/api/admin/reports/sprints/[id]/documents/[documentId]/pdf/route.ts",
 "src/app/api/admin/reports/sprints/[id]/documents/[documentId]/route.ts",
 "src/app/api/admin/reports/sprints/[id]/documents/[documentId]/template-update/route.ts",
 "src/app/api/admin/reports/sprints/[id]/documents/route.ts",
 "src/app/api/admin/reports/sprints/[id]/history/route.ts",
 "src/app/api/admin/reports/sprints/[id]/language/route.ts",
 "src/app/api/admin/reports/sprints/[id]/logo/route.ts",
 "src/app/api/admin/reports/sprints/[id]/notes/route.ts",
 "src/app/api/admin/reports/sprints/[id]/pdf/route.ts",
 "src/app/api/admin/reports/sprints/[id]/prepare/route.ts",
 "src/app/api/admin/reports/sprints/[id]/render-references/route.ts",
 "src/app/api/admin/reports/sprints/[id]/sections/route.ts",
 "src/app/api/admin/reports/sprints/[id]/team-context/route.ts",
 "src/app/api/admin/reports/templates/route.ts"
] as const;
const ancillary=[
 "src/app/api/admin/kanban-periods/[id]/pdf/route.ts",
 "src/app/api/admin/kanban-periods/[id]/report-reference/route.ts",
 "src/app/api/admin/kanban-periods/[id]/report/route.ts",
 "src/app/api/ai-briefs/archives/[id]/download/route.ts",
 "src/app/api/ai-briefs/archives/[id]/responses/[responseId]/route.ts",
 "src/app/api/ai-briefs/archives/[id]/responses/route.ts"
] as const;

test("22 endpoints rapports/documents/archives : tous refusent les anciens accès en v28",()=>{
 assert.equal(reports.length,22);
 for(const path of reports){
  const src=source(path);
  if(path.includes("/archives/[id]/download/")){
   assert.match(src,/withLegacyReportReadDb\(readArchive\)/);
   assert.match(src,/resolveAdminTeam\(db/);
   assert.match(src,/canAccess\(actor,"download"/);
  }else if(path.endsWith("/documents/route.ts")){
   assert.match(src,/listTeamStudioDocuments\(db/);
   assert.match(src,/createTeamStudioDocument\(db/);
   assert.match(src,/withLegacyTeamApi\(/);
  }else if(path.includes("/documents/[documentId]/template-update/")){
   assert.match(src,/readTeamStudioDocument\(db/);
   assert.match(src,/withLegacyReportReadDb\(/);
  }else if(path.includes("/documents/[documentId]/route.ts")){
   assert.match(src,/readTeamStudioDocument\(db/);
   assert.match(src,/saveTeamStudioDocument\(db/);
   assert.match(src,/withLegacyReportReadDb\(/);
  }else if(path.includes("/documents/[documentId]/pdf/")){
   assert.match(src,/readTeamStudioDocument\(db/);
   assert.match(src,/withLegacyTeamApi\(generate\)/);
  }else if(path.includes("/archives/[id]/visibility/")){
   assert.match(src,/assertTeamPdfArchive\(db/);
   assert.match(src,/withLegacyTeamApi\(/);
  }else{
   assert.ok(src.includes("withLegacyTeamApi(")||src.includes("withLegacyReportReadDb("),path);
   assert.doesNotMatch(src,/withAuthDb\(|withSprintIndexDb\(/,path);
  }
 }
});
test("6 sorties indirectes Kanban/PDF/briefs IA : même protection anti-fuite",()=>{
 assert.equal(ancillary.length,6);
 for(const path of ancillary){
  const src=source(path);
  assert.match(src,/withLegacyTeamApi\(/,path);
  assert.doesNotMatch(src,/withAuthDb\(/,path);
 }
});
test("wrapper de lecture protège v27/v28 AVANT l'ancienne requête",()=>{
 const x=source("src/server/reports/legacy-read.ts");
 assert.match(x,/await assertLegacyTeamApi\(db\)/);
 assert.match(x,/return read\(db\)/);
 assert.ok(x.indexOf("await assertLegacyTeamApi(db)")<x.indexOf("return read(db)"));
});
test("Centre Rapports v28 : filtre teamId SQL, aucune archive ni ouverture Studio",()=>{
 const api=source("src/server/reports/center.ts");
 const body=api.slice(api.indexOf("export async function readTeamCenter"));
 assert.match(body,/WHERE d.team_id=\$1/);
 assert.match(body,/WHERE s.team_id=\$1/);
 assert.match(body,/i\.schema_version IN \(28,29,30,31\)/);
 assert.doesNotMatch(body,/await searchPdfArchives\(|await listUserPdfArchives\(/);
 const ui=source("src/app/app/reports/page.tsx");
 assert.match(ui,/resolveAdminTeam\(db,/);
 assert.match(ui,/readTeamCenter\(db,team\)/);
 assert.match(ui,/!scoped&&<NewReportForm/);
 assert.match(ui,/canManage=\{account.role==="admin"&&!scoped\}/);
 assert.match(ui,/account\.role==="admin"&&!scoped&&<NewReportForm/);
 const detail=source("src/app/app/reports/[documentId]/page.tsx");
 assert.match(detail,/await assertLegacyTeamApi\(db\)/);
});
test("v28 n'active pas le sélecteur ni les écritures d'équipe",()=>{
 assert.match(source("src/lib/team-context-readiness.ts"),
  /SMN_MULTI_TEAM_PILOT_ACK==="I_ACCEPT_UNVERIFIED_ISOLATION"/);
});
