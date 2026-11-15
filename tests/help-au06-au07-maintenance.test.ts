import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {describe,it} from "node:test";
import path from "node:path";
import {SafeHelpMarkdown} from "../src/app/app/help/safe-markdown";
import {helpArticleById} from "../src/lib/help-catalog";
import {loadHelpContent} from "../src/server/help-content";
import {buildHelpIndexes} from "../scripts/build-help-index.mjs";

const user={role:"user",is_active:true,must_change_password:false};
const root=path.resolve("content/help");
const read=(p:string)=>readFile(p,"utf8");
const render=(markdown:string)=>renderToStaticMarkup(createElement(SafeHelpMarkdown,{markdown}));

describe("AU-06 — FAQ deep link to first-time setup",()=>{
 it("uses the same canonical article and direct destination in FR and EN",async()=>{
  const center=await read("src/app/app/help/page.tsx");
  assert.match(center,/typeof requested==="string"\?requested:null/);
  assert.match(center,/visible\.find\(item=>item\.id===articleId\)/);
  assert.equal(helpArticleById("overview",user,"scrum")?.id,"overview");
  assert.equal(helpArticleById("overview",user,"kanban")?.id,"overview");
  for(const locale of ["fr","en"] as const){
   const result=await loadHelpContent("faq",locale,user,"scrum",root);
   assert.equal(result.status,"ready");
   if(result.status!=="ready")continue;
   assert.equal(result.contentLocale,locale);
   const destination="/app/help?article=overview";
   const links=[...result.markdown.matchAll(/\]\((\/app[^)\s]+)\)/g)].map(x=>x[1]);
   assert.equal(links.filter(x=>x.includes("?article=")).length,1);
   assert.ok(links.includes(destination));
   const html=render(result.markdown);
   assert.ok(html.includes('href="'+destination.replace("?","?")+'"'),locale+": deep link must be clickable");
   assert.match(result.markdown,locale==="fr"?/guide de première configuration/:/first-time setup guide/);
  }
 });
 it("does not expand the safe Markdown surface to arbitrary query parameters, external URLs or scripts",()=>{
  const html=render([
   "[OK](/app/help?article=overview)",
   "[Unknown](/app/help?article=unknown)",
   "[UnknownQuery](/app/help?article=overview&mode=admin)",
   "[Search](/app/help?q=admin)",
   "[Escaped](/app/help?article=%2e%2e)",
   "[External](https://example.com)",
   "[Script](javascript:alert)"
  ].join(" "));
  assert.ok(html.includes('href="/app/help?article=overview"'));
  assert.equal((html.match(/href=/g)??[]).length,1,html);
  for(const label of ["Unknown","UnknownQuery","Search","Escaped","External","Script"]){
   assert.ok(html.includes(label));
  }
 });
 it("rejects stale search indexes and preserves FR/EN coverage",async()=>{
  assert.deepEqual((await buildHelpIndexes({check:true})).map(x=>x.locale),["en","fr"]);
  for(const locale of ["fr","en"] as const){
   const index=JSON.parse(await read(path.join(root,".index",locale+".json")));
   const faq=index.articles.find((x:{id:string})=>x.id==="faq");
   assert.ok(faq);
   assert.equal(index.articles.length,14);
   assert.ok(faq.searchText.includes(locale==="fr"?"configuration":"first time setup"));
  }
 });
});

describe("AU-07 — maintainers get current accurate test and offline contracts",()=>{
 it("describes existing verification commands and does not claim real Windows installation was tested",async()=>{
  const [readme,workflow,pack,offline,script]=await Promise.all([
   read("content/help/README.md"),
   read(".github/workflows/help-quality.yml"),
   read("scripts/windows/package-portable.mjs"),
   read("tests/smn-468-offline-help.test.mjs"),
   read("scripts/build-help-index.mjs")
  ]);
  assert.match(readme,/node scripts\/build-help-index\.mjs --check/);
  assert.match(script,/export async function buildHelpIndexes/);
  assert.match(readme,/14 articles canoniques/);
  assert.match(readme,/localStorage/);
  assert.match(readme,/sans.*(Internet|réseau)|sans accès Internet/i);
  assert.match(readme,/pas encore qualifié|pas une installation réelle/i);
  assert.match(offline,/Windows-like app\/content\/help payload/);
  assert.match(pack,/verifyOfflineHelp/);
  assert.match(workflow,/pnpm typecheck/);
  assert.match(workflow,/pnpm i18n:check/);
  assert.match(workflow,/pnpm build/);
  assert.match(workflow,/for iteration in 1 2 3/);
  assert.match(readme,/43690693920/);
  for(const name of [
   "tests/smn-469-help-contract.test.ts",
   "tests/smn-469-help-browser.test.ts",
   "tests/help-au01-kanban-access.test.ts",
   "tests/help-au02-context-entry.test.ts",
   "tests/help-au03-role-safe-links.test.ts",
   "tests/help-au04-registry-documentation.test.ts",
   "tests/help-au05-functional-guides.test.ts",
   "tests/help-au06-au07-maintenance.test.ts"
  ]){
   assert.ok(readme.includes(name.split("/").at(-1)!),name);
   await read(name);
  }
 });
});
