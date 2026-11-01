import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const r=(p:string)=>readFileSync(p,"utf8");
test("SMN-348: isolated preview and transactional commit",()=>{
 const preview=r("src/server/indicators/input-preview.ts");
 const route=r("src/app/api/admin/indicators/input/route.ts");
 const input=r("src/app/app/admin/indicators/universal-input.tsx");
 assert.match(preview,/requireIndicatorTeam/);
 assert.match(preview,/evaluateDependencies/);
 assert.doesNotMatch(preview,/INSERT INTO|UPDATE public|COMMIT/);
 assert.match(route,/writeManualValues/);
 assert.match(route,/validMutationOrigin/);
 assert.match(input,/aria-modal="true"/);
 assert.match(input,/run\("preview"\)/);
 assert.match(input,/run\("save"\)/);
 assert.match(input,/setPreview\(null\)/);
});
