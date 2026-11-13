import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {createDefaultDashboardLayout,validateDashboardLayout} from "../src/server/dashboard-builder/layout";
import {updateBlockDimensions,validateBlockDimensions} from "../src/lib/dashboard-builder/dimensions";
import {getDashboardTemplate} from "../src/lib/dashboard-builder/templates";
import {dashboardRowColumns} from "../src/lib/dashboard-builder/consultation-layout";
test("SMN-368 AC1: immutable dimensions persist as block metadata",()=>{
 const original=createDefaultDashboardLayout("scrum");
 const id=original.rows[0].blocks[0].id;
 const changed=updateBlockDimensions(original,id,{width:3,height:400});
 assert.deepEqual(changed.rows[0].blocks[0].dimensions,{width:3,height:400});
 assert.equal(original.rows[0].blocks[0].dimensions,undefined);
 assert.equal(changed.rows[0].blocks[0].id,id);
 validateDashboardLayout(changed);
 assert.deepEqual(JSON.parse(JSON.stringify(changed)).rows[0].blocks[0].dimensions,{width:3,height:400});
});
test("SMN-368 AC1/AC4: reject invalid dimensions and allow return to auto",()=>{
 for(const dimensions of [{width:5,height:"auto"},{width:2,height:0},{width:2,height:99},{width:2,height:"auto",test:true}])
  assert.throws(()=>validateBlockDimensions(dimensions),/invalid/);
 assert.deepEqual(validateBlockDimensions({width:2,height:"auto"}),{width:2,height:"auto"});
});
test("SMN-368 AC3: M05/M06 retain asymmetrical intrinsic cells",()=>{
 for(const name of ["M05","M06"] as const){
  const template=getDashboardTemplate(name)!;
  assert.ok(template.slots.some(cell=>cell.columnSpan>1||cell.rowSpan>1));
 }
});
test("SMN-368 AC2/AC4: floating panel and mobile overrides",()=>{
 const panel=readFileSync(new URL("../src/app/app/dashboard-builder/block-dimensions.tsx",import.meta.url),"utf8");
 const css=readFileSync(new URL("../src/app/app/dashboard-builder/dashboard-dimensions.module.css",import.meta.url),"utf8");
 const page=readFileSync(new URL("../src/app/app/dashboard-builder/dashboard-consultation.tsx",import.meta.url),"utf8");
 assert.match(panel,/useDashboardModalFocus/);
 assert.match(panel,/Largeur du bloc/);
 assert.match(panel,/Hauteur du bloc/);
 assert.match(panel,/Auto/);
 assert.match(panel,/onChange\(draft\)/);
 assert.match(css,/@media\(max-width:767\.98px\)/);
 assert.match(css,/height:auto!important/);
 assert.match(css,/overflow:auto/);
 assert.match(page,/gridColumn/);
 assert.match(page,/gridRow/);
});

test("SMN-368: consultation rows grow to five or six columns without changing four-column defaults",()=>{
 const blocks=(count:number)=>Array.from({length:count},()=>({dimensions:undefined}));
 assert.equal(dashboardRowColumns(blocks(1)),4);
 assert.equal(dashboardRowColumns(blocks(4)),4);
 assert.equal(dashboardRowColumns(blocks(5)),5);
 assert.equal(dashboardRowColumns(blocks(6)),6);
 assert.equal(dashboardRowColumns(blocks(7)),6);
 assert.equal(dashboardRowColumns([{dimensions:{width:3 as const,height:"auto" as const}},...blocks(2)]),5);
 const css=readFileSync(new URL("../src/app/app/dashboard-builder/dashboard-dimensions.module.css",import.meta.url),"utf8");
 const page=readFileSync(new URL("../src/app/app/dashboard-builder/dashboard-consultation.tsx",import.meta.url),"utf8");
 assert.match(css,/repeat\(var\(--smn-row-columns,4\),minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:1199\.98px\)/);
 assert.match(css,/@media\(max-width:767\.98px\)/);
 assert.match(page,/dashboardRowColumns\(row\.map\(item=>item\.block\)\)/);
});
