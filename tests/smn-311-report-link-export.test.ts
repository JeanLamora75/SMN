import assert from "node:assert/strict";
import test from "node:test";
import {reportLinksHtml,reportLinksMarkdown,safeExportLinks} from "../src/lib/report-links-export";
test("links escape markup in PDF html and remain clickable",()=>{
 const html=reportLinksHtml([{title:"A < B",url:"https://example.org/?a=1&b=2"}]);
 assert.match(html,/<a href="https:\/\/example\.org\/\?a=1&amp;b=2">A &lt; B<\/a>/);
});
test("markdown retains selection order and blocks dangerous protocols",()=>{
 const refs=[{title:"First",url:"https://example.org/1"},{title:"Bad",url:"javascript:alert(1)"},{title:"Second",url:"https://example.org/2"}];
 const md=reportLinksMarkdown(refs);
 assert.ok(md.indexOf("First")<md.indexOf("Second"));
 assert.doesNotMatch(md,/Bad|javascript:/);
 assert.equal(safeExportLinks(refs).length,2);
});
