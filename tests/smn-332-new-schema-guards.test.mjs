import assert from "node:assert/strict";
import {test} from "node:test";
import {auditPatch} from "../scripts/check-new-schema-guards.mjs";
const patch=(path,added)=>`diff --git a/${path} b/${path}
--- a/${path}
+++ b/${path}
@@ -1,1 +1,${added.length+1} @@
 existing
${added.map(x=>"+"+x).join("\n")}
`;
test("new SQL version bound in API fails with file, line and rule",()=>{
 const violations=auditPatch(patch("src/app/api/demo/route.ts",["if(i.schema_version>=32)return null;"]));
 assert.equal(violations.length,1);
 assert.deepEqual(violations[0],{path:"src/app/api/demo/route.ts",line:2,rule:"schema-version-sql",source:"if(i.schema_version>=32)return null;"});
});
test("new JS list and bounds in API fail",()=>{
 const result=auditPatch(patch("src/app/api/demo/route.ts",["if([28,29,30,31].includes(version))return;","if(schemaVersion>=32)return;"]));
 assert.deepEqual(result.map(x=>x.rule),["schema-list","schema-version-js"]);
});
test("non-API adapters and centralized capability checks pass",()=>{
 assert.deepEqual(auditPatch(patch("src/server/schema/compatibility.ts",["if(schema_version>=32)return;"])),[]);
 assert.deepEqual(auditPatch(patch("src/app/api/demo/route.ts",['if(evaluateSchemaCapability(schema,"multi-team").ok)return;'])),[]);
});
test("documented exception requires actual test evidence",()=>{
 const added=["// smn-schema-guard-exception: justified legacy adapter with migration tests test=tests/adapter.test.ts","if(schema_version>=32)return;"];
 assert.equal(auditPatch(patch("src/app/api/demo/route.ts",added),{testExists:()=>true}).length,0);
 assert.equal(auditPatch(patch("src/app/api/demo/route.ts",added),{testExists:()=>false}).length,1);
});
test("removed lines do not count as new failures",()=>{
 const diff="diff --git a/src/app/api/demo/route.ts b/src/app/api/demo/route.ts\n--- a/src/app/api/demo/route.ts\n+++ b/src/app/api/demo/route.ts\n@@ -1,2 +1,1 @@\n-if(schema_version>=28)return;\n unchanged\n";
 assert.deepEqual(auditPatch(diff),[]);
});
