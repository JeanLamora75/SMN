import assert from "node:assert/strict";
import {test} from "node:test";
import {auditApplicationDependencies,classifyDependency,scanLegacyDependencies} from "../scripts/smn-351-app-dependencies";
test("SMN-351: historical Sprint closure and report composition block SQL removal",()=>{
 const report=auditApplicationDependencies();
 const relevant=report.runtimeBlockers.map(x=>x.file);
 assert.ok(relevant.includes("src/server/sprints/closure.ts"),"closure snapshots still read legacy values");
 assert.ok(relevant.includes("src/server/reports/standard-composition.ts"),"standard reports still read legacy values");
 assert.equal(report.authorizedForDrop,false);
 assert.ok(report.references.every(x=>x.line>0&&x.relation.startsWith("smn_sprint_")));
});
test("SMN-351: test and migration files do not hide runtime dependencies",()=>{
 assert.equal(classifyDependency("src/server/sprints/closure.ts"),"runtime-blocker");
 assert.equal(classifyDependency("src/server/reports/standard-composition.ts"),"runtime-blocker");
 assert.equal(classifyDependency("tests/smn-234-sprint-indicators-d3.test.ts"),"migration-or-test");
 assert.equal(classifyDependency("prisma/migrations/old/migration.sql"),"migration-or-test");
 assert.ok(scanLegacyDependencies().some(x=>x.classification==="runtime-blocker"));
});
