import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const source=readFileSync(new URL("../src/app/app/admin/sprints/historical/historical-sprint-form.tsx",import.meta.url),"utf8");
test("SMN-159 AC6 : option décochée par défaut",()=>{
 assert.ok(source.includes("const [createAnother,setCreateAnother]=useState(false)"));
 assert.ok(source.includes("Enregistrer un autre Sprint après celui-ci"));
 assert.ok(source.includes("checked={createAnother}"));
});
test("SMN-159 AC7-8 : confirmation persistante et nouveau formulaire",()=>{
 assert.ok(source.includes('{created&&<div role="status"'));
 assert.ok(source.includes("{(!created||continueEntry)&&<form"));
 assert.ok(source.includes("setContinueEntry(createAnother)"));
 for(const value of ['setName("")','setStart("")','setEnd("")','setGenerateCeremonies(false)','setCreateAnother(false)','setOperationId(crypto.randomUUID())'])
  assert.ok(source.includes(value),value);
});
test("SMN-159 AC9 : erreurs avant la remise à zéro",()=>{
 assert.ok(source.indexOf("if(!res.ok||!json.ok)")<source.indexOf("setContinueEntry(createAnother)"));
});
