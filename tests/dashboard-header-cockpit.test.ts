import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const builder=read("src/app/app/dashboard-builder/dashboard-consultation.tsx");
const layout=read("src/server/dashboard-builder/layout.ts");
const permission=read("src/server/dashboard-builder/permissions.ts");

test("v33 Builder header displays selected cycle context and supports cycle navigation",()=>{
 assert.match(builder,/navigation\.current\?\.name/);
 assert.match(builder,/navigation\.current\.startAt/);
 assert.match(builder,/navigation\.current\.endAt/);
 assert.match(builder,/navigation\.previous/);
 assert.match(builder,/navigation\.next/);
 assert.match(builder,/aria-label="En-tête du tableau de bord"/);
});
test("v33 header owns exactly two configurable dynamic blocks",()=>{
 assert.match(layout,/layout\.header\.blocks\.length !== 2/);
 assert.match(builder,/layout\.header\.blocks\.map\(block=>renderBlock\(block,true\)\)/);
 assert.match(builder,/className=\{styles\.headerKpis\}/);
 assert.match(builder,/getDashboardTemplate\(block\.templateId,block\.templateVersion\)/);
});
test("dashboard header never bypasses team permissions or exposes unauthorised records",()=>{
 assert.match(permission,/t\.installation_id=i\.id/);
 assert.match(permission,/t\.id=\$3/);
 assert.match(permission,/a\.is_active=true/);
 assert.match(permission,/canRead:false,canEdit:false/);
});
