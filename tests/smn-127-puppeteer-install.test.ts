import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const pkg=JSON.parse(readFileSync("package.json","utf8"));
test("Puppeteer Core is a runtime dependency installed with SMN",()=>{
 assert.equal(typeof pkg.dependencies["puppeteer-core"],"string");
 assert.equal(pkg.devDependencies?.["puppeteer-core"],undefined);
});
test("PDF doctor checks the library and browser separately",()=>{
 const code=readFileSync("scripts/report-pdf-doctor.mjs","utf8");
 assert.match(code,/PDF_PUPPETEER_INSTALLED/);
 assert.match(code,/PDF_PUPPETEER_MISSING/);
 assert.match(code,/PDF_CHROME_FOUND/);
});
