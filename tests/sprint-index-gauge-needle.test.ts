import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const component=readFileSync(new URL("../src/app/app/admin/sprints/sprint-index-view.tsx",import.meta.url),"utf8");

test("tachometer needle travels left to top to right and clamps above 100%",()=>{
 assert.match(component,/const ratio=Math\.min\(100,Math\.max\(0,value\)\)/);
 assert.match(component,/const angle=180\+\(ratio\*1\.8\)/);
 const needle=(percent:number)=>{
  const ratio=Math.min(100,Math.max(0,percent));
  const radians=(180+ratio*1.8)*Math.PI/180;
  return {x:22+14*Math.cos(radians),y:22+14*Math.sin(radians)};
 };
 const epsilon=1e-9;
 for(const [percent,x,y] of [[0,8,22],[50,22,8],[100,36,22],[128,36,22]]){
  const point=needle(percent);
  assert.ok(Math.abs(point.x-x)<epsilon,`x at ${percent}%`);
  assert.ok(Math.abs(point.y-y)<epsilon,`y at ${percent}%`);
 }
 assert.match(component,/number\(item\.metrics\[code\],code\)/);
});
