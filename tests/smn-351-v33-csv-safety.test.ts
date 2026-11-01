import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=(path:string)=>readFileSync(path,"utf8");
test("v33 historical CSV validation and template do not advertise an obsolete import",()=>{
 const validation=read("src/app/api/admin/historical-csv/validate/route.ts");
 const template=read("src/app/api/admin/historical-csv/template/route.ts");
 assert.match(validation,/version===33/);
 assert.match(validation,/v33-indicator-mapping-required/);
 assert.match(template,/schema_version===33/);
 assert.match(template,/v33-indicator-mapping-required/);
});
test("v33 historical CSV preview and confirmation must fail closed before legacy writes",()=>{
 const preview=read("src/server/historical-csv/preview.ts");
 const confirm=read("src/server/historical-csv/confirm.ts");
 assert.match(preview,/schema_version===33/);
 assert.match(preview,/throw Error\("v33-indicator-mapping-required"\)/);
 assert.match(confirm,/schema_version===33/);
 assert.match(confirm,/return invalid\("v33-indicator-mapping-required"\)/);
});
test("v33 closure freezes dynamic indicator values and skips legacy SP schema",()=>{
 const closure=read("src/server/sprints/closure.ts");
 assert.match(closure,/if\(v\.rows\[0\]\?\.schema_version!==33\)await ensureStoryPointsSchema\(db\)/);
 assert.match(closure,/captureCycleIndicators/);
 assert.match(closure,/INSERT INTO public\.smn_sprint_closure_snapshot/);
});
