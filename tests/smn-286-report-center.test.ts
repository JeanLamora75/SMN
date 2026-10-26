import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import path from "node:path";
import test from "node:test";
import {formatReportCenterDate} from "../src/lib/report-center-date";

const root=path.resolve(import.meta.dirname,"..");
const page=readFileSync(path.join(root,"src/app/app/reports/page.tsx"),"utf8");
const dialog=readFileSync(path.join(root,"src/app/app/reports/new-report-form.tsx"),"utf8");
const css=readFileSync(path.join(root,"src/app/app/reports/report-center-cockpit.css"),"utf8");

test("report timestamp from PostgreSQL with microseconds is readable",()=>{
 const date=formatReportCenterDate("2026-10-26 08:22:53.122981+01","fr");
 assert.match(date,/26/);
 assert.match(date,/2026/);
 assert.doesNotMatch(date,/\d{6}\+01/);
 assert.notEqual(date,"—");
 assert.equal(formatReportCenterDate("not-a-date","fr"),"—");
});
test("date presentation follows report locale without leaking raw ISO",()=>{
 const fr=formatReportCenterDate("2026-10-26T08:22:53+01:00","fr");
 const en=formatReportCenterDate("2026-10-26T08:22:53+01:00","en");
 assert.notEqual(fr,en);
 assert.ok(en.includes("Oct"));
});
test("center retains existing report, model and archive routes",()=>{
 assert.match(page,/const tabs=\["reports","templates","archives"\]/);
 assert.match(page,/name="cycleId"/);
 assert.match(page,/name="status"/);
 assert.match(page,/name="q"/);
 assert.match(page,/TemplateLibrary/);
 assert.match(page,/\/api\/admin\/reports\/archives\//);
});
test("admin-only creation uses native modal and preserves existing request contract",()=>{
 assert.match(page,/account\.role==="admin"&&<NewReportForm/);
 assert.match(dialog,/<dialog/);
 assert.match(dialog,/\.showModal\(\)/);
 assert.match(dialog,/onCancel=/);
 assert.match(dialog,/onClose=/);
 assert.match(dialog,/crypto\.randomUUID\(\)/);
 assert.match(dialog,/requestId:id/);
 assert.match(dialog,/\/api\/admin\/reports\/sprints\//);
 assert.match(dialog,/router\.push/);
 assert.match(dialog,/setError\(tr\("createError"\)\)/);
});
test("Cockpit treatment is scoped to reports, responsive and theme aware",()=>{
 assert.match(page,/smn-report-cockpit/);
 assert.match(css,/--smn-context-start/);
 assert.match(css,/--smn-context-end/);
 assert.match(css,/--smn-surface/);
 assert.match(css,/@media\(max-width:767\.98px\)/);
 assert.match(css,/::backdrop/);
});
