import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(path,"utf8");
test("AI brief preparation hides the technical ID and displays localized cycle dates",()=>{
 const page=read("src/app/app/admin/ai-briefs/prepare/page.tsx");
 assert.doesNotMatch(page,/t\("identifier"\).*context\.id/);
 assert.match(page,/formatBriefCycleDates\(context\.startAt,context\.endAt,context\.timeZone,locale\)/);
 const dates=read("src/lib/ai-brief-date.ts");
 assert.match(dates,/dateStyle:"long"/);
 assert.match(dates,/timeZone:parsed\.zone/);
});
test("Built-in templates can be previewed without the custom template API",()=>{
 const client=read("src/app/app/admin/ai-briefs/prepare/brief-overrides.tsx");
 assert.match(client,/if\(base\.builtin\)/);
 assert.match(client,/initialBriefTemplate\(base\.id\)/);
 assert.match(client,/setRevisionChecked\(true\);return true/);
 assert.match(client,/base\.builtin\?localizedNativeBrief\(template,locale\)/);
});
test("Collective projection includes configured indicators and saved sprint capacity",()=>{
 const page=read("src/app/app/admin/ai-briefs/prepare/page.tsx");
 const facts=read("src/server/ai-briefs/facts.ts");
 assert.match(page,/indicators\.filter\(item=>item\.available&&item\.value!==null\)/);
 assert.match(facts,/readSavedCapacityKpis\(db,cycleId\)/);
 assert.match(facts,/s\.status==="closed"\?null/);
});
