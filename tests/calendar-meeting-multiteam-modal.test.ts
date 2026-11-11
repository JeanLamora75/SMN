import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {describe,it} from "node:test";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
describe("Consultation et édition des événements Scrum v33",()=>{
 const route=read("src/app/api/team-calendar/meetings/[kind]/[id]/route.ts");
 const outcomes=read("src/app/api/team-calendar/meetings/[kind]/[id]/outcomes/route.ts");
 const service=read("src/server/sprints/calendar-meeting-detail.ts");
 const modal=read("src/app/app/team-calendar/calendar-meeting-modal.tsx");
 const calendar=read("src/app/app/team-calendar/team-calendar-view.tsx");
 const dashboard=read("src/app/app/dashboard-builder/dashboard-record-editor.tsx");
 it("ne bloque plus les lectures v33 avec le garde monoéquipe",()=>{
  assert.doesNotMatch(route,/withLegacyTeamApi/);
  assert.doesNotMatch(outcomes,/withLegacyTeamApi/);
  assert.match(route,/withSprintIndexDb/);
  assert.match(outcomes,/withSprintIndexDb/);
 });
 it("vérifie le périmètre et la permission avant de lire les fiches",()=>{
  assert.match(route,/resolveAdminTeam/);
  assert.match(route,/indicatorTeams/);
  assert.match(route,/return readCalendarMeeting\(db,kind,id,version>=28\?teamId:null\)/);
  assert.match(service,/s\.team_id=\$2/);
  assert.match(outcomes,/readCalendarMeeting\(db,kind,id,version>=28\?teamId:null\)/);
 });
 it("assure les mutations dans une équipe autorisée",()=>{
  assert.match(route,/withAuthDb/);
  assert.match(route,/readCalendarMeeting\(db,kind,id,team\.team_id\)/);
  assert.match(outcomes,/readCalendarMeeting\(db,kind,id,team\.team_id\)/);
 });
 it("transmet le contexte équipe du calendrier et du dashboard",()=>{
  assert.match(calendar,/teamId=\{initialTeamId\}/);
  assert.match(dashboard,/teamId=\{teamId\}/);
  assert.match(modal,/const scopedApi=api/);
  assert.match(modal,/fetch\(scopedApi/);
 });
});
