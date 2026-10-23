import test from "node:test";
import assert from "node:assert/strict";
import {validReportLogo} from "../src/server/reports/logo-contract";
test("logo optional and rejects non-image payload",()=>{
 assert.equal(validReportLogo(null),false);
 assert.equal(validReportLogo({mime:"image/svg+xml",base64:"PHN2Zz4="}),false);
 assert.equal(validReportLogo({mime:"image/png",base64:Buffer.from("not image").toString("base64")}),false);
});
test("accepts bounded PNG header, rejects oversized input",()=>{
 const file=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),Buffer.alloc(20)]);
 assert.equal(validReportLogo({mime:"image/png",base64:file.toString("base64")}),true);
 assert.equal(validReportLogo({mime:"image/png",base64:Buffer.concat([file,Buffer.alloc(256*1024)]).toString("base64")}),false);
});
