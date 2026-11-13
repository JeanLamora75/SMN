import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const page=read("src/app/app/admin/scrum-cadence/page.tsx");
const form=read("src/app/app/admin/scrum-cadence/cadence-form.tsx");

test("Scrum cadence introductory sentence appears only in the page hero",()=>{
 assert.match(page,/description=\{translate\(locale,"scrumCadence\.intro"\)\}/);
 assert.doesNotMatch(form,/t\("scrumCadence\.intro"\)/);
 assert.doesNotMatch(form,/<h2 className="h5">\{t\("scrumCadence\.title"\)\}<\/h2>/);
});
test("duration and IANA timezone share a responsive two-column row",()=>{
 const start=form.indexOf('<div className="row g-3">');
 const end=form.indexOf('</div>\n   <div className="row g-3">',start);
 assert.ok(start>=0&&end>start);
 const firstRow=form.slice(start,end);
 assert.match(firstRow,/col-12 col-md-6/);
 assert.match(firstRow,/id="cadence-weeks"/);
 assert.match(firstRow,/IanaTimeZoneSelect id="cadence-zone"/);
 assert.equal((form.match(/IanaTimeZoneSelect id="cadence-zone"/g)??[]).length,1);
});
test("cadence updates preserve the previously persisted fields",()=>{
 for(const key of ["durationWeeks","startDay","startTime","endDay","endTime","timeZone","revision"]){
  assert.ok(form.includes(key+":draft."+key)||key==="revision"&&form.includes("revision:current?.revision"),key);
 }
 assert.match(form,/method:"PATCH"/);
 assert.match(form,/useUnsavedChanges\(dirty\|\|busy/);
});
