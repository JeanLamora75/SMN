import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import fr from "../src/i18n/fr.json";
import en from "../src/i18n/en.json";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const page=read("src/app/app/admin/sprints/[sprintId]/page.tsx");
const panel=read("src/app/app/admin/sprints/[sprintId]/sprint-ceremonies-panel.tsx");
const form=read("src/app/app/admin/sprints/[sprintId]/historical-event-form.tsx");

test("historical meeting button appears in ceremonies actions, between records and bulk controls",()=>{
 assert.match(page,/canAddHistoricalMeeting=\{canManage&&cycle.status==="finished"\}/);
 assert.doesNotMatch(page,/<HistoricalEventForm sprintId=/);
 assert.match(panel,/canAddHistoricalMeeting&&<HistoricalEventForm sprintId=\{sprintId\}\/>/);
 assert.ok(panel.indexOf('t("sprintDetail.ceremonyCurrent")')<panel.indexOf("canAddHistoricalMeeting&&"));
 assert.ok(panel.indexOf("canAddHistoricalMeeting&&")<panel.indexOf("<SprintCeremoniesBulkAction"));
});
test("meeting entry and corrections are in a Cockpit Agile native modal with a close action",()=>{
 assert.match(form,/<dialog ref=\{dialog\}/);
 assert.match(form,/showModal\(\)/);
 assert.match(form,/className="modal-content smn-cockpit-modal"/);
 assert.match(form,/className="smn-cockpit-modal-header"/);
 assert.match(form,/className="smn-cockpit-modal-body"/);
 assert.match(form,/onCancel=\{e=>/);
 assert.match(form,/disabled=\{busy\}/);
 assert.match(form,/router.refresh\(\)/);
 assert.doesNotMatch(form,/Ajouter un événement historique documenté/);
});
test("all historical meeting labels are provided in both catalogs",()=>{
 assert.equal(fr.historicalMeeting.add,"Ajouter réunion");
 assert.equal(en.historicalMeeting.add,"Add meeting");
 const keys=Object.keys(fr.historicalMeeting) as (keyof typeof fr.historicalMeeting)[];
 assert.deepEqual(keys.slice().sort(),Object.keys(en.historicalMeeting).sort());
 for(const key of keys){
  assert.ok(fr.historicalMeeting[key].trim(),key);
  assert.ok(en.historicalMeeting[key].trim(),key);
 }
 for(const key of ["title","intro","name","kind","date","duration","status","correct","corrected","outsideSprint"]){
  assert.match(form,new RegExp('tr\\("'+key+'"\\)'));
 }
});
