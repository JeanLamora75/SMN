import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const page=read("src/app/app/admin/sprints/[sprintId]/page.tsx");
const panel=read("src/app/app/admin/sprints/[sprintId]/sprint-indicators-panel.tsx");
const service=read("src/server/sprints/sprint-capacity-kpis.ts");

test("Sprint indicators do not render obsolete historical capacity forms",()=>{
 assert.doesNotMatch(page,/HistoricalCapacityForm|HistoricalActualCapacityForm/);
 assert.match(page,/SprintIndicatorsPanel/);
});
test("C01 and C02 remain editable through the standard cockpit modal",()=>{
 assert.match(panel,/group==="capacity"\?"capacity-kpis"/);
 assert.match(panel,/code:"C01"/);
 assert.match(panel,/code:"C02"/);
 assert.doesNotMatch(panel,/if\(!editable&&/);
 assert.doesNotMatch(panel,/if\(!editable\|\|\(g==="capacity"/);
});
test("Historical open sprints use standard KPI persistence and calculated references",()=>{
 assert.doesNotMatch(service,/historical-capacity-protected/);
 assert.match(service,/readSavedCapacityKpis\(db,sprint.id\)/);
 assert.match(service,/readDevelopmentCapacity\(db,start,end/);
 assert.match(service,/readActualCapacity\(db,start,end/);
 assert.match(service,/legacyPlanned/);
 assert.match(service,/legacyActual/);
});
