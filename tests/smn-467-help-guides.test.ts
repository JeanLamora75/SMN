import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {helpCatalog} from "../src/lib/help-catalog";
import {loadHelpContent} from "../src/server/help-content";
import {buildHelpIndexes} from "../scripts/build-help-index.mjs";
import {TICKET_CSV_COLUMNS,validateTicketCsv} from "../src/lib/ticket-csv-contract";

const root=path.resolve("content/help");
const admin={role:"admin",is_active:true,must_change_password:false};
const user={role:"user",is_active:true,must_change_password:false};

describe("SMN-467 — module guides and troubleshooting",()=>{
 it("covers all canonical catalog articles in both locales with matching search indexes",async()=>{
  await buildHelpIndexes({check:true});
  const ids=new Set(helpCatalog(admin,"scrum").concat(helpCatalog(admin,"kanban")).map(a=>a.id));
  for(const locale of ["fr","en"]){
   const index=JSON.parse(await readFile(path.join(root,".index",locale+".json"),"utf8")) as {
    version:number;locale:string;articles:{id:string;title:string;searchText:string}[]
   };
   assert.equal(index.version,1);
   assert.equal(index.locale,locale);
   const indexed=new Set(index.articles.map(a=>a.id));
   for(const id of ids){
    assert.ok(indexed.has(id),locale+": missing "+id);
    const source=await readFile(path.join(root,locale,id+".md"),"utf8");
    assert.match(source,/^#\s+[^\n]+/);
    assert.match(source,/^##\s+[^\n]+/m);
    assert.ok(source.length>160,locale+"/"+id);
   }
  }
 });
 it("publishes precise CSV headers matching the actual validator in both languages",async()=>{
  const header=TICKET_CSV_COLUMNS.join(",");
  assert.equal(header,"id,type,resume,priority,status,sp");
  assert.equal(validateTicketCsv(header+"\nQA-1,Story,Example,High,Done,3").valid,true);
  for(const locale of ["fr","en"]){
   const md=await readFile(path.join(root,locale,"tickets.md"),"utf8");
   assert.ok(md.includes(header));
   assert.match(md,/8 (Mio|MiB)/);
   assert.match(md,/20[ ,.]?000/);
  }
 });
 it("respects Scrum/Kanban and restricted documentation for direct reads",async()=>{
  assert.equal((await loadHelpContent("sprints","fr",admin,"kanban",root)).status,"forbidden");
  assert.equal((await loadHelpContent("kanban-periods","en",admin,"scrum",root)).status,"forbidden");
  assert.equal((await loadHelpContent("jira-settings","en",user,"scrum",root)).status,"forbidden");
  for(const id of ["faq","tickets","indicators"]){
   const result=await loadHelpContent(id,"fr",admin,"scrum",root);
   assert.equal(result.status,"ready");
  }
 });
 it("only links to actual internal page routes, with no external content fetches",async()=>{
  for(const locale of ["fr","en"]){
   const dir=path.join(root,locale);
   const idx=JSON.parse(await readFile(path.join(root,".index",locale+".json"),"utf8")) as {
    articles:{id:string}[]
   };
   for(const entry of idx.articles){
    const md=await readFile(path.join(dir,entry.id+".md"),"utf8");
    assert.doesNotMatch(md,/<script|\]\(https?:\/\//i);
    for(const match of md.matchAll(/\]\((\/app(?:\/[a-z0-9-]+)*)\)/g)){
     const suffix=match[1].replace(/^\/app\/?/,"");
     const file=path.join("src/app/app",suffix,"page.tsx");
     await assert.doesNotReject(readFile(file,"utf8"),locale+"/"+entry.id+": "+match[1]);
    }
   }
  }
 });
 it("shares the same article source between center and contextual modals",async()=>{
  const center=await readFile("src/app/app/help/page.tsx","utf8");
  const modal=await readFile("src/app/app/help/help-context-button.tsx","utf8");
  const endpoint=await readFile("src/app/api/help/articles/[articleId]/route.ts","utf8");
  assert.match(center,/loadHelpContent\(selected\.id,locale,account,mode\)/);
  assert.match(endpoint,/loadHelpContent\(articleId,locale,actor,mode\)/);
  assert.match(modal,/\/api\/help\/articles\//);
  assert.doesNotMatch(modal,/method:"POST"/);
 });
});
