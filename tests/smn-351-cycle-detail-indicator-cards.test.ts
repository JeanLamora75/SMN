import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("cycle detail shows ordered indicator cards with name value unit and tag",()=>{
 const component=read("src/app/app/admin/indicators/reporting-view.tsx");
 const reporting=read("src/server/indicators/reporting.ts");
 assert.match(component,/screen==="cycle_detail"&&data&&data.columns.length>0/);
 assert.match(component,/data\.columns\.map\(column=>/);
 assert.match(component,/column\.name/);
 assert.match(component,/cycle\?\.values\[column\.id\]/);
 assert.match(component,/column\.unit/);
 assert.match(component,/column\.tag/);
 assert.match(component,/screen!=="cycle_detail"&&<div className="table-responsive"/);
 assert.match(reporting,/ORDER BY COALESCE\(p\.display_order,0\),d\.tag,d\.id/);
});
