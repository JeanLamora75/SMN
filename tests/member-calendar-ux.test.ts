import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {describe,it} from "node:test";

const source=(file:string)=>readFileSync(new URL("../"+file,import.meta.url),"utf8");
const detail=source("src/app/app/admin/members/[id]/member-detail.tsx");
const summary=source("src/app/app/admin/members/[id]/member-calendar-summary.tsx");
const weekly=source("src/app/app/admin/members/member-calendar-editor.tsx");
const exception=source("src/app/app/admin/members/member-calendar-exception-editor.tsx");

describe("Fiche membre V2 — Calendrier : consultation et modales séparées",()=>{
 it("place l'historique des trames sous la grille hebdomadaire dans l'onglet",()=>{
  const tab=detail.slice(detail.indexOf('tab==="calendar"'),detail.indexOf('tab==="absences"'));
  assert.match(tab,/<MemberCalendarSummary/);
  assert.match(summary,/members\.calendar\.weekHistory/);
  assert.match(summary,/value\.weeks\.map\(week=>/);
  const weekTableEnd=summary.indexOf('</table></div>',summary.indexOf('days.map('));
  const weekHistory=summary.indexOf('members.calendar.weekHistory');
  assert.ok(weekTableEnd>=0&&weekHistory>weekTableEnd);
  assert.match(summary,/members\.calendar\.noHistory/);
 });
 it("conserve les historiques d'exceptions avec dates, créneaux, révisions et remarques",()=>{
  assert.match(summary,/value\.exceptions\.map\(exception=>/);
  assert.match(summary,/members\.calendar\.exceptionHistory/);
  assert.match(summary,/exception\.on_date/);
  assert.match(summary,/exception\.revision/);
  assert.match(summary,/exception\.morning/);
  assert.match(summary,/exception\.afternoon/);
  assert.match(summary,/exception\.note/);
 });
 it("ne garde dans Modifier la trame que les sept jours et la date d'effet",()=>{
  assert.match(weekly,/WEEKDAYS=\[/);
  assert.match(weekly,/onSubmit=\{saveWeek\}/);
  assert.match(weekly,/action:"weekly"/);
  assert.match(weekly,/calendar-effective/);
  assert.match(weekly,/setWeek\(rows=>rows\.map/);
  for(const forbidden of [
   "MemberAbsenceEditor","MemberCalendarExceptionEditor","members.calendar.weekHistory",
   "members.calendar.exceptionHistory","members.calendar.exceptionHeading",
   "members.absence.","onSubmit={saveException}","absenceDirty",
   "calendar-on-date"
  ])assert.ok(!weekly.includes(forbidden),"La modale trame contient encore : "+forbidden);
 });
 it("propose Ajouter une exception depuis l'onglet et dans une modale distincte",()=>{
  assert.match(detail,/onClick=\{\(\)=>setSection\("calendarException"\)\}/);
  assert.match(detail,/<MemberCalendarExceptionEditor/);
  assert.match(detail,/members\.calendar\.addException/);
  assert.match(detail,/disabled=\{section!==null\|\|member\.archived\}/);
  assert.match(exception,/action:"exception"/);
  assert.match(exception,/onSubmit=\{save\}/);
  assert.match(exception,/latestException\(data,date\)\?\.revision/);
  assert.match(exception,/applicableWeek\(data,date\)/);
  assert.doesNotMatch(exception,/MemberAbsenceEditor|members\.calendar\.weekHistory/);
 });
 it("recharge les calendriers enregistrés après ajout ou changement",()=>{
  assert.match(detail,/setCalendarRefreshKey\(current=>current\+1\)/);
  assert.match(detail,/key=\{member\.id\+"-"\+calendarRefreshKey\}/);
  assert.match(detail,/<MemberCalendarEditor[^>]*onSaved=\{saved\}/s);
  assert.match(detail,/<MemberCalendarExceptionEditor[^>]*onSaved=\{saved\}/s);
  assert.match(summary,/cache:"no-store"/);
 });
 it("conserve le contrôle des brouillons, la validation et l'API existante",()=>{
  assert.match(weekly,/useUnsavedChanges/);
  assert.match(exception,/useUnsavedChanges/);
  assert.match(weekly,/revision:newest\(data\)\?\.revision\?\?0/);
  assert.match(exception,/note:selection\.note\.trim\(\)\|\|null/);
  assert.match(weekly,/members\.calendar\.invalidDate/);
  assert.match(exception,/members\.calendar\.weeklyMissing/);
  for(const code of [weekly,exception]){
   assert.match(code,/\/api\/admin\/members\//);
   assert.doesNotMatch(code,/DELETE FROM|DROP TABLE|TRUNCATE/);
  }
 });
 it("dispose des traductions existantes et du bouton nouveau dans les deux langues",()=>{
  for(const locale of ["fr","en"]){
   const messages=JSON.parse(source("src/i18n/"+locale+".json")).members.calendar;
   for(const key of [
    "addException","weekHeading","weekHistory","noHistory","exceptionHeading","exceptionHistory",
    "effectiveFrom","saveWeek","saveException","onDate","morning","afternoon","revision",
    "note","availabilityMissing","archived","invalidDate","weeklyMissing"
   ])assert.ok(typeof messages[key]==="string"&&messages[key].trim(),locale+" "+key);
  }
 });
});
