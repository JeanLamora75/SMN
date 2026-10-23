import test from "node:test";
import assert from "node:assert/strict";
import {publicExportFailure,safeExportDiagnostic,validExportOperationId} from "../src/server/reports/export-outcome";
test("failure messages are limited to stable harmless codes",()=>{
 assert.equal(publicExportFailure(new Error("secret token in /private/report.pdf")),"archive-write-failed");
 assert.equal(publicExportFailure(new Error("invalid-pdf")),"pdf-invalid");
 const diagnostic=safeExportDiagnostic("archive-write-failed","an internal identifier");
 assert.deepEqual(Object.keys(diagnostic),["event","status","code","reference"]);
 assert.doesNotMatch(JSON.stringify(diagnostic),/private|token|identifier/);
});
test("retry IDs must be UUID shaped",()=>{
 assert.equal(validExportOperationId("11111111-1111-4111-8111-111111111111"),true);
 assert.equal(validExportOperationId("../../file"),false);
});
