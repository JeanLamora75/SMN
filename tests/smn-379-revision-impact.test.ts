import assert from "node:assert/strict";
import {test} from "node:test";
import {revisionImpactWindow} from "../src/server/members/assignment-revision-impact";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("révision R2 du 20/02 au 03/05 avant retour Développeur le 04/05",()=>{
 const versions=[{revision:1,effective_from:"2026-01-06"},
 {revision:2,effective_from:"2026-02-20"},
 {revision:3,effective_from:"2026-05-04"}];
 assert.deepEqual(revisionImpactWindow(versions,versions[1],null),
  {start:"2026-02-20",end:"2026-05-03"});
 assert.deepEqual(revisionImpactWindow(versions,versions[2],"2026-10-14"),
  {start:"2026-05-04",end:"2026-10-14"});
});
test("deux révisions le même jour : la version masquée ne modifie aucun calcul",()=>{
 const versions=[{revision:1,effective_from:"2026-01-05"},
  {revision:2,effective_from:"2026-01-05"}];
 assert.equal(revisionImpactWindow(versions,versions[0],"2026-10-14"),null);
 assert.deepEqual(revisionImpactWindow(versions,versions[1],"2026-10-14"),
  {start:"2026-01-05",end:"2026-10-14"});
});
test("les deux écritures contrôlent la période effective, pas toute l'affectation",()=>{
 for(const file of ["src/server/members/team-assignment-revision-cancel.ts",
  "src/server/members/team-assignment-historical-correction.ts"]){
  const content=read(file);
  assert.match(content,/revisionImpactWindow\(/);
  assert.match(content,/\[team\.team_id,impact\.start,impact\.end\]/);
  assert.match(content,/if\(impact\)\{/);
  assert.doesNotMatch(content,/\[team\.team_id,assignment\.start_on,assignment\.end_on\]/);
 }
 const editor=read("src/app/app/admin/members/assignment-editor.tsx");
 assert.match(editor,/motif : "\+reason/);
});
