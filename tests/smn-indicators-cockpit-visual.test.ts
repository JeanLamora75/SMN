import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(name:string)=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
test("Indicator Cockpit reuses Sprint hero and content styling",()=>{
 const page=read("src/app/app/admin/indicators/page.tsx");
 assert.match(page,/smn-sprint-detail-cockpit smn-indicator-cockpit/);
 assert.match(page,/smn-sprint-detail-hero/);
 assert.match(page,/smn-sprint-detail-content/);
 assert.match(page,/indicator-cockpit\.css/);
});
test("team tabs use Cockpit variant without affecting Settings pages",()=>{
 const catalog=read("src/app/app/admin/indicators/catalog-client.tsx");
 const tabs=read("src/app/app/admin/settings/settings-tabs.tsx");
 assert.match(catalog,/variant=\{scope==="team"\?"cockpit":"default"\}/);
 assert.match(tabs,/variant="default"/);
 assert.match(tabs,/smn-indicator-tabs/);
});
test("cycle table shows full names and tooltip tags",()=>{
 const cycles=read("src/app/app/admin/indicators/indicator-cycles.tsx");
 assert.match(cycles,/title=\{column\.tag\}/);
 assert.match(cycles,/\{column\.name\}/);
 assert.match(cycles,/smn-indicator-cycle-table/);
 assert.doesNotMatch(cycles,/title=\{column\.name\} className="text-end">\{column\.tag\}/);
});
