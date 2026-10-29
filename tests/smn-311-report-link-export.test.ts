import {readFileSync} from "node:fs";
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
 const md=reportLinksMarkdown([{title:"One [label]\\name\n- injected",url:"https://example.org/a(b)"}]);
 assert.match(md,/One \\\[label\\\]\\\\name/);
 assert.match(md,/%28b%29/);
 assert.equal(md.split("\n- ").length,2); // une seule puce réelle, après le titre de section
 assert.doesNotMatch(md,/\n- injected/);
});
test("empty or invalid references do not create an export section",()=>{
 assert.equal(reportLinksMarkdown([{title:"Unsafe",url:"javascript:alert(1)"}]),"");
 assert.equal(reportLinksHtml([]),"");
});

test("PDF HTML escapes malicious title markup and URL attributes",()=>{
 const html=reportLinksHtml([{title:'<img src=x onerror="alert(1)">',url:"https://example.org/?a=1&b=2"}]);
 assert.doesNotMatch(html,/<img/);
 assert.match(html,/&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
 assert.match(html,/href="https:\/\/example\.org\/\?a=1&amp;b=2"/);
});
test("rejects credentials and unsupported URL schemes",()=>{
 const urls=["javascript:alert(1)","data:text/html,x","https://user:password@example.org/path"];
 assert.deepEqual(safeExportLinks(urls.map(url=>({title:"Bad",url}))),[]);
});

test("final PDF archive freezes the same references used to render it",()=>{

 const route=readFileSync(new URL("../src/app/api/admin/reports/sprints/[id]/documents/[documentId]/pdf/route.ts",import.meta.url),"utf8");
 assert.match(route,/const links=actor\.role==="admin"\?safeExportLinks\(await selectedReportExportLinks/);
 assert.match(route,/renderStudioPdf\(eligible\.document,links\)/);
 assert.match(route,/optionsSnapshot:\{[^}]*reportLinks:links\}/);
});

test("archive preserves PDF bytes and manifest metadata for saved links",()=>{
 const store=readFileSync(new URL("../src/server/reports/pdf-archive-store.ts",import.meta.url),"utf8");
 assert.match(store,/optionsSnapshot:\{\.\.\.manifest\.optionsSnapshot/);
 assert.match(store,/JSON\.stringify\(finalManifest\)/);
 assert.match(store,/const written=await readFile\(location\)/);
 assert.match(store,/integrity\.sha256!==manifest\.sha256/);
 assert.match(store,/verified\.sha256===record\.sha256/);
});

test("SMN-314 displays an optional comment in Markdown and PDF without breaking old links",()=>{
 const refs=[{title:"Doc",url:"https://example.org",description:"Why this link matters\nAdditional context"}];
 const md=reportLinksMarkdown(refs),html=reportLinksHtml(refs);
 assert.match(md,/Why this link matters\n  Additional context/);
 assert.match(html,/Why this link matters<br>Additional context/);
 assert.doesNotMatch(reportLinksHtml([{title:"Legacy",url:"https://example.org"}]),/<p>/);
});
test("SMN-314 safely escapes comment content in HTML",()=>{
 const html=reportLinksHtml([{title:"Doc",url:"https://example.org",description:'<script>alert("x")</script>'}]);
 assert.doesNotMatch(html,/<script>/);
 assert.match(html,/&lt;script&gt;/);
});
