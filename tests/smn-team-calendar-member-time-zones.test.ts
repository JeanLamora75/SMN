import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
const source=(p:string)=>readFileSync(p,"utf8");
test("team time zone API returns distinct effective IANA zones without member identity",()=>{
 const api=source("src/app/api/team-calendar/time-zones/route.ts");
 assert.match(api,/SELECT DISTINCT latest.time_zone/);
 assert.match(api,/m.archived_at IS NULL/);
 assert.match(api,/l.effective_from<=CURRENT_DATE/);
 assert.match(api,/authorizeApi\(req,"read"/);
 assert.match(api,/timeZones:\[\.\.\.new Set\(zones\)\]/);
});
test("calendar offers selector only with multiple zones and propagates the chosen one",()=>{
 const view=source("src/app/app/team-calendar/team-calendar-view.tsx");
 assert.match(view,/teamTimeZones.length<=1/);
 assert.match(view,/setSelectedTimeZone\(e.target.value\)/);
 assert.match(view,/timeZone=\{selectedTimeZone\}/);
});
test("meeting hours and day grouping use chosen time zone",()=>{
 const calendar=source("src/app/app/team-calendar/calendar-option-b.tsx");
 assert.match(calendar,/timeZone,hour:"2-digit",minute:"2-digit"/);
 assert.match(calendar,/calendarDay\(m.startAt,timeZone\)/);
});
