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

test("markdown escapes bracket and backslash markup without adding rows",()=>{
 const md=reportLinksMarkdown([{title:"One [label]\\\\name\\n- injected",url:"https://example.org/a(b)"}]);
 assert.match(md,/One/);
 assert.match(md,/%28b%29/);
 assert.equal(md.split("\\n- ").length,2);
 assert.doesNotMatch(md,/\\n- injected/);
});
test("empty or invalid references do not create an export section",()=>{
 assert.equal(reportLinksMarkdown([{title:"Unsafe",url:"javascript:alert(1)"}]),"");
 assert.equal(reportLinksHtml([]),"");
});
