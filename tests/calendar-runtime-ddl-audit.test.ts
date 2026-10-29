import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const source=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const calendarServices=[
 "src/server/members/central-calendar.ts","src/server/members/team-calendar.ts",
 "src/server/members/calendar.ts","src/server/members/absence.ts",
 "src/server/sprints/work-slot-config.ts","src/server/sprints/calendar-meeting-outcomes.ts",
 "src/server/sprints/calendar-meeting-reschedule.ts","src/server/capacity/work-slots.ts",
 "src/server/holidays/manual.ts","src/server/holidays/annual-validation.ts",
 "src/server/holidays/validation-audit.ts"
];
test("Calendrier: services du périmètre courant sans DDL à l'exécution",()=>{
 for(const path of calendarServices)assert.doesNotMatch(
  source(path),/\b(?:CREATE|ALTER|DROP|TRUNCATE)\s+(?:TABLE|INDEX|VIEW)\b/i,path);
});
test("Calendrier: identifier explicitement la dépendance ancienne du report Sprint",()=>{
 const legacy=source("src/server/sprints/reschedule.ts");
 assert.match(legacy,/i\.schema_version<=27/);
 assert.match(legacy,/CREATE TABLE IF NOT EXISTS public\.smn_sprint_reschedule_audit/);
});
