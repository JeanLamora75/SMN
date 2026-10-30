import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const route=read("src/app/api/admin/sprints/reschedule/route.ts");
const form=read("src/app/app/admin/sprints/[sprintId]/sprint-detail-editor.tsx");
const service=read("src/server/sprints/reschedule.ts");
test("confirmation : erreurs serveur journalisées et non révélées au navigateur",()=>{
 assert.match(route,/sprint-reschedule-confirm-failed/);
 assert.match(route,/error:"unavailable"/);
 assert.doesNotMatch(route,/jsonResult\(\{error:detail\}/);
});
test("confirmation : raison fonctionnelle affichée sans supprimer les choix implicites",()=>{
 for(const code of ["stale-preview","events-outside-new-period","invalid-input","unavailable"])
  assert.ok(form.includes('data.error==="'+code+'"'));
 assert.match(form,/removeCeremonies/);
 assert.match(service,/ROLLBACK/);
 assert.match(service,/checked\.warnings\.some\(e=>!e\.removable\)/);
 assert.match(service,/checked\.warnings\.some\(e=>!removeIds\.includes\(e\.id\)\)/);
 assert.match(service,/events-outside-new-period/);
});
