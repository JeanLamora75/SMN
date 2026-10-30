import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const panel=read("src/app/app/admin/sprints/[sprintId]/sprint-capacity-panel.tsx");
const page=read("src/app/app/admin/sprints/[sprintId]/page.tsx");
const engine=read("src/server/capacity/engine.ts");
test("présence calculée pour les membres affectés, développement par rôle Agile",()=>{
 assert.match(engine,/availableHalfDays\*hoursPerJh\/2/);
 assert.match(engine,/developerPercent\/100/);
 assert.match(panel,/part de rôle Agile Développeur/);
});
test("diagnostic : distinguer données non calculables, lien contextualisé",()=>{
 assert.match(panel,/sans version en vigueur pendant le Sprint/);
 assert.match(panel,/encodeURIComponent\(m\.memberId\).*new URLSearchParams\(\{teamId\}\)/);
 assert.match(page,/teamId=\{teamId\} canViewNames=/);
});
