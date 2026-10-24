import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {absenceNamesByDate} from "../src/lib/calendar-absence-names";
import fr from "../src/i18n/fr.json";
import en from "../src/i18n/en.json";
const source=(path:string)=>readFileSync(resolve(process.cwd(),path),"utf8");

describe("Calendrier — info-bulle nominative des absences",()=>{
 it("regroupe chaque membre une seule fois par jour et classe les noms",()=>{
  const names=absenceNamesByDate([
   {id:"b",displayName:"Zoé Martin",days:[
    {date:"2026-11-17",hasDeclaredAbsence:true},
    {date:"2026-11-17",hasDeclaredAbsence:true},
    {date:"2026-11-18",hasDeclaredAbsence:false}]},
   {id:"a",displayName:"Alice Dupont",days:[
    {date:"2026-11-17",hasDeclaredAbsence:true}]},
   {id:"c",displayName:"Camille Leroy",days:[
    {date:"2026-11-18",hasDeclaredAbsence:true}]}
  ]);
  assert.deepEqual(names["2026-11-17"],["Alice Dupont","Zoé Martin"]);
  assert.deepEqual(names["2026-11-18"],["Camille Leroy"]);
  assert.equal(Object.keys(names).length,2);
 });
 it("ne divulgue pas de noms si le serveur ne transmet pas de détails autorisés",()=>{
  assert.deepEqual(absenceNamesByDate(undefined),{});
  assert.deepEqual(absenceNamesByDate([]),{});
  assert.deepEqual(absenceNamesByDate([
   {id:"a",displayName:"Alice Dupont",days:[{date:"2026-11-17",hasDeclaredAbsence:false}]}
  ]),{});
 });
 it("s'appuie sur le même indicateur que le compteur collectif",()=>{
  const server=source("src/server/members/team-calendar.ts");
  assert.match(server,/hasDeclaredAbsence/);
  assert.match(server,/if\(hasDeclaredAbsence\)count\.declaredAbsentMemberCount\+\+/);
  assert.match(server,/personalDays\.push\(\{date,assignmentApplicable:true,hasDeclaredAbsence/);
 });
 it("n'affiche pas de détails nominatifs hors admin, ni de motif ou catégorie",()=>{
  const parent=source("src/app/app/team-calendar/team-calendar-view.tsx");
  const child=source("src/app/app/team-calendar/calendar-option-b.tsx");
  assert.match(parent,/isAdmin\?absenceNamesByDate\(p\.admin\?\.members\):\{\}/);
  assert.match(child,/absentNames\[date\]/);
  assert.match(child,/role="tooltip"/);
  assert.match(child,/aria-describedby=/);
  assert.match(child,/smn-cal-absence-tooltip/);
  assert.doesNotMatch(child,/\.reason\b|\.categoryName\b/);
  assert.match(child,/focus-within|aria-expanded/);
 });
 it("fonctionne aussi bien dans les deux vues et dispose des traductions FR/EN",()=>{
  const child=source("src/app/app/team-calendar/calendar-option-b.tsx");
  assert.ok(child.indexOf("const renderEvents=")<child.indexOf('if(mode==="agenda")'));
  assert.match(child,/\{renderEvents\(date\)\}/);
  assert.equal(typeof fr.calendarOptionB.absentMembers,"string");
  assert.equal(typeof en.calendarOptionB.absentMembers,"string");
 });
});
