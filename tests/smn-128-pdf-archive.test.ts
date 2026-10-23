import test from "node:test";
import assert from "node:assert/strict";
import {newPdfManifest,validateFinalPdf} from "../src/server/reports/pdf-archive-contract";
test("reject absent and malformed final PDFs",()=>{
 assert.equal(validateFinalPdf(Buffer.from("not a PDF")),null);
 assert.equal(validateFinalPdf(Buffer.from("%PDF-1.7\nnot-final")),null);
});
test("exact bytes receive reproducible SHA256, unique archive identity",()=>{
 const data=Buffer.from("%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF\n");
 const meta={authorId:"admin",language:"fr" as const,templateId:"standard",teamId:"team",cycleId:"sprint",cycleStatus:"closed",snapshotVersion:2};
 const a=newPdfManifest(data,meta),b=newPdfManifest(data,meta);
 assert.equal(a.sha256,b.sha256);assert.notEqual(a.id,b.id);assert.equal(a.byteLength,data.length);
 assert.equal(validateFinalPdf(Buffer.concat([data,Buffer.from("changed")]))?.sha256===a.sha256,false);
});
