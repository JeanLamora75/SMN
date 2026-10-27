import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const view=()=>read("src/app/app/team-calendar/team-calendar-view.tsx");
const cards=()=>read("src/app/app/team-calendar/calendar-option-b.tsx");
const css=()=>read("src/app/app/team-calendar/calendar-cockpit.css");

test("Le cockpit est limité à la page Calendrier et reprend les panneaux Registres",()=>{
 const ui=view(),styles=css();
 assert.match(read("src/app/app/team-calendar/page.tsx"),/import "\.\/calendar-cockpit\.css"/);
 for(const className of ["smn-calendar-cockpit","smn-cal-hero","smn-cal-filters-panel","smn-cal-results"])
  assert.ok(ui.includes(className),className);
 assert.match(styles,/\.smn-calendar-cockpit \.smn-cal-hero/);
 assert.match(styles,/\.smn-calendar-cockpit \.smn-cal-absence/);
 assert.doesNotMatch(styles,/\.smn-registry-cockpit/);
 assert.doesNotMatch(styles,/\.smn-registry-detail/);
});

test("Le bandeau réutilise le vrai contexte d'équipe et de cycle",()=>{
 const ui=view();
 assert.match(ui,/smn-cal-context-item[^>]*><BootstrapIcon name="people-fill"\/><strong>\{teamName\}/);
 assert.match(ui,/period\?\.sprintId\?period\.label:t\("calendarOptionB\.fallback"\)/);
 assert.match(ui,/currentDate\(period\.start\).*currentDate\(shift\(period\.start,period\.count-1\)\)/);
 assert.match(ui,/onClick=\{\(\)=>change\(-1\)\}/);
 assert.match(ui,/onClick=\{\(\)=>change\(1\)\}/);
 assert.match(ui,/onClick=\{resetPeriod\}/);
});

test("Cartes et Agenda restent exclusifs avec filtres et fuseaux synchronisés",()=>{
 const ui=view(),cal=cards();
 assert.match(ui,/aria-pressed=\{view==="cards"\}/);
 assert.match(ui,/aria-pressed=\{view==="agenda"\}/);
 assert.match(ui,/aria-pressed=\{showMeetings\}/);
 assert.match(ui,/aria-pressed=\{showAbsences\}/);
 assert.match(ui,/value=\{selectedTimeZone\} onChange=\{e=>setSelectedTimeZone\(e\.target\.value\)\}/);
 assert.match(ui,/showMeetings=\{showMeetings\} showAbsences=\{showAbsences\} isEditable=\{isEditable\}/);
 assert.match(cal,/if\(mode==="agenda"\)/);
 assert.match(cal,/return <div className="smn-calendar-grid"/);
});

test("Les actions métier, les dates et les autorisations existantes sont préservées",()=>{
 const ui=view(),cal=cards();
 assert.match(ui,/if\(!isAdmin\|\|\[0,6\]\.includes/);
 assert.match(ui,/s\.status!=="closed"/);
 assert.match(cal,/renderActions=\(date:string\)=>isEditable\(date\)/);
 assert.match(cal,/onMeeting\(date\)/);
 assert.match(cal,/onAbsence\(date\)/);
 assert.match(ui,/initialDate=\{absenceEditor\}/);
 assert.match(ui,/onMeeting=\{openCreate\} onOpenEvent=\{setSelectedMeeting\}/);
 assert.match(ui,/initialTeamId\?\{teamId:initialTeamId\}/);
});

test("Styles conservant les sept colonnes, les jours particuliers et les thèmes",()=>{
 const styles=css(),cal=cards();
 assert.match(styles,/grid-template-columns:repeat\(7,minmax\(140px,1fr\)\)/);
 assert.match(styles,/overflow-x:auto/);
 assert.match(styles,/\.smn-cal-card\.is-nonwork/);
 assert.match(styles,/\.smn-cal-card\.is-today/);
 assert.match(styles,/--smn-cal-absence-surface:color-mix/);
 assert.match(styles,/@media\(max-width:767\.98px\)/);
 assert.match(cal,/weekend\|\|holiday\?" is-nonwork"/);
 assert.match(cal,/date===today\?" is-today"/);
});

test("Les libellés du cockpit existent en français et en anglais",()=>{
 for(const lang of ["fr","en"]){
  const locale=JSON.parse(read("src/i18n/"+lang+".json"));
  for(const key of ["heroSubtitle","filtersHeading","scheduleHeading","zoneLabel","zoneFailed","kanbanPeriod"])
   assert.equal(typeof locale.calendarOptionB[key],"string",lang+" "+key);
 }
});
