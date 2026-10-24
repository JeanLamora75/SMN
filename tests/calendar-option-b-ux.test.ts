import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {describe,it} from "node:test";
import {resolve} from "node:path";
import fr from "../src/i18n/fr.json";
import en from "../src/i18n/en.json";

const source=(path:string)=>readFileSync(resolve(process.cwd(),path),"utf8");
describe("Calendrier Option B — contrats de présentation",()=>{
 it("démarre en Cartes et conserve période, filtres et source de données entre vues",()=>{
  const s=source("src/app/app/team-calendar/team-calendar-view.tsx");
  assert.match(s,/useState<CalendarMode>\("cards"\)/);
  assert.match(s,/setView\("agenda"\)/);
  assert.match(s,/setView\("cards"\)/);
  assert.match(s,/showMeetings=\{showMeetings\} showAbsences=\{showAbsences\}/);
  assert.match(s,/absenceCounts=\{absenceCounts\}/);
  assert.match(s,/setRefreshToken\(n=>n\+1\)/);
 });
 it("affiche une seule ligne de compteur d'absences avant les réunions",()=>{
  const s=source("src/app/app/team-calendar/calendar-option-b.tsx");
  const content=s.slice(s.indexOf("const renderEvents="),s.indexOf("const renderActions="));
  assert.ok(content.indexOf("smn-cal-absence")>=0);
  assert.ok(content.indexOf("smn-cal-absence")<content.indexOf("dayMeetings.map"));
  assert.match(content,/showAbsences&&count>0/);
  assert.match(content,/calendarOptionB\.absences/);
  assert.equal(content.includes("memberName"),false);
  assert.equal(content.includes("categoryName"),false);
  assert.match(s,/if\(mode==="agenda"\)/);
 });
 it("sépare le nombre d'absents déclarés des autres indisponibilités",()=>{
  const reader=source("src/server/members/team-calendar.ts");
  const projection=source("src/server/members/central-calendar.ts");
  assert.match(reader,/declaredAbsentMemberCount/);
  assert.match(reader,/absenceOnDate\(\{startOn:a\.start_on/);
  assert.match(projection,/day\.declaredAbsentMemberCount>0/);
  assert.doesNotMatch(projection,/day\.reportedUnavailable>0/);
 });
 it("préserve les jours non ouvrés et les deux commandes de création",()=>{
  const s=source("src/app/app/team-calendar/calendar-option-b.tsx");
  const parent=source("src/app/app/team-calendar/team-calendar-view.tsx");
  assert.match(parent,/\[0,6\]\.includes/);
  assert.match(s,/onMeeting\(date\)/);
  assert.match(s,/onAbsence\(date\)/);
  assert.match(s,/BootstrapIcon name=\{meetingIcon\(m\)\}/);
 });
 it("dispose des traductions FR/EN pour tous les nouveaux contrôles",()=>{
  const french=fr.calendarOptionB,english=en.calendarOptionB;
  assert.deepEqual(Object.keys(french).sort(),Object.keys(english).sort());
  assert.equal(french.absences,"Absences ({count})");
  assert.equal(english.absences,"Absences ({count})");
 });
});
