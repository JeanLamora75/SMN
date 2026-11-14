import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import fr from "../src/i18n/fr.json";
import en from "../src/i18n/en.json";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const row=read("src/app/app/admin/sprints/[sprintId]/sprint-register-row.tsx");
const action=read("src/app/app/admin/sprints/[sprintId]/automatic-highlight-actions.tsx");
const route=read("src/app/api/admin/registries/automatic-highlights/[id]/route.ts");

test("live generated highlights get both actions; snapshots never get writable controls",()=>{
 assert.match(row,/const automaticHighlight=!historical&&item\.kind==="highlight"&&href===null&&canManage/);
 assert.match(row,/automaticHighlight&&<AutomaticHighlightActions/);
 assert.match(action,/name="pencil-square"/);
 assert.match(action,/name="trash-fill"/);
 assert.match(action,/aria-label=\{tr\("delete"\)\+": "\+title\}/);
 assert.match(action,/window\.confirm\(tr\("confirm"\)/);
});
test("automatic highlights can be edited without editing their source and deleted transactionally",()=>{
 assert.match(route,/authorizeApi\(req,"write"/);
 assert.match(route,/FOR UPDATE OF h/);
 assert.match(route,/found\.rows\[0\]\.title!==body\.expectedTitle/);
 assert.match(route,/UPDATE public\.smn_automatic_highlight SET title=\$2 WHERE id=\$1/);
 assert.match(route,/DELETE FROM public\.smn_automatic_highlight WHERE id=\$1/);
 assert.match(route,/DELETE FROM public\.smn_fact_selection WHERE origin='automatic'/);
 assert.doesNotMatch(route,/DELETE FROM public\.smn_registry_item/);
 assert.doesNotMatch(route,/DELETE FROM public\.smn_sprint_goal/);
 assert.match(route,/ROLLBACK/);
 assert.match(action,/router\.refresh\(\)/);
});
test("actions and confirmation are translated both ways",()=>{
 for(const key of ["edit","delete","heading","save","cancel","confirm","error","conflict","title"] as const){
  assert.ok(fr.sprintHighlight[key]);
  assert.ok(en.sprintHighlight[key]);
 }
 assert.match(fr.sprintHighlight.confirm,/source/);
 assert.match(en.sprintHighlight.confirm,/source/);
});
