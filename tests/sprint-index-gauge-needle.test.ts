import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const component=readFileSync(new URL("../src/app/app/admin/sprints/sprint-index-view.tsx",import.meta.url),"utf8");

test("dynamic percent gauges use native progress and cap the visual scale at 100%",()=>{
 assert.match(component,/col\.style==="gauge"/);
 assert.match(component,/Number\.isFinite\(Number\(raw\)\)/);
 assert.match(component,/value=\{Math\.max\(0,Math\.min\(100,Number\(raw\)\)\)\}/);
 assert.match(component,/max=\{100\}/);
 const clamp=(n:number)=>Math.max(0,Math.min(100,n));
 for(const [input,expected] of [[-10,0],[0,0],[50,50],[100,100],[128,100]])
  assert.equal(clamp(input),expected);
 assert.match(component,/raw===null\?"—"/);
});
