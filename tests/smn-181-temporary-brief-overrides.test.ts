import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const client=readFileSync("src/app/app/admin/ai-briefs/prepare/brief-overrides.tsx","utf8");
const page=readFileSync("src/app/app/admin/ai-briefs/prepare/page.tsx","utf8");
const api=readFileSync("src/app/api/admin/ai-briefs/templates/route.ts","utf8");
test("the preparation inherits the selected persisted template",()=>{
 assert.match(page,/template=\{selected\}/);
 assert.match(client,/useState<Editable>\(\(\)=>editable\(template\)\)/);
 assert.match(client,/sections:\[\.\.\.t.sections\]/);
});
test("temporary changes stay client-side until explicit model save",()=>{
 assert.match(client,/Enregistrer le modèle/);
 assert.match(client,/action:"update"/);
 assert.match(client,/revision:base.revision/);
 assert.match(api,/authorizeApi\(req,"write",scope\)/);
 assert.match(client,/Recharger le modèle/);
});
test("a stale model revision is detected before explicit persistence",()=>{
 assert.match(client,/current.revision!==base.revision/);
 assert.match(client,/res.status===409/);
 assert.match(client,/setConflict\(true\)/);
});
