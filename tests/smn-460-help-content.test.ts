import assert from "node:assert/strict";
import {mkdtemp,mkdir,writeFile,rm,readFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {describe,it} from "node:test";
import {loadHelpContent,helpContentNotice} from "../src/server/help-content";
import {SafeHelpMarkdown} from "../src/app/app/help/safe-markdown";

const admin={role:"admin",is_active:true,must_change_password:false};
const user={role:"user",is_active:true,must_change_password:false};
const root=path.resolve("content/help");

describe("Localized help loading",()=>{
 it("loads just the requested article and locale, independently of app i18n JSON",async()=>{
  const r=await loadHelpContent("overview","en",user,"scrum",root);
  assert.equal(r.status,"ready");
  if(r.status!=="ready")return;
  assert.equal(r.contentLocale,"en");
  assert.equal(r.isFallback,false);
  assert.match(r.markdown,/First-time configuration/);
  assert.equal(helpContentNotice(r),null);
  assert.doesNotMatch(r.markdown,/Bien démarrer/);
 });
 it("uses a clearly disclosed French fallback when the translation is missing",async()=>{
  const r=await loadHelpContent("tickets","de",user,"kanban",root);
  assert.equal(r.status,"ready");
  if(r.status!=="ready")return;
  assert.equal(r.requestedLocale,"de");
  assert.equal(r.contentLocale,"fr");
  assert.equal(r.isFallback,true);
  assert.match(helpContentNotice(r)??"",/française/);
 });
 it("does not reveal an article restricted to administrators",async()=>{
  const r=await loadHelpContent("general-settings","fr",user,"scrum",root);
  assert.equal(r.status,"forbidden");
  assert.equal((await loadHelpContent("general-settings","fr",admin,"scrum",root)).status,"ready");
 });
 it("blocks unknown IDs, invalid locales, path traversal and inapplicable modes",async()=>{
  for(const id of ["../secrets","__proto__","not-registered","tickets/other"]){
   assert.equal((await loadHelpContent(id,"en",admin,"scrum",root)).status,
    id==="not-registered"?"forbidden":"not-found");
  }
  assert.equal((await loadHelpContent("tickets","../fr",user,"scrum",root)).status,"not-found");
  assert.equal((await loadHelpContent("sprints","fr",admin,"kanban",root)).status,"forbidden");
 });
 it("supports a third language by adding only a file, no React change",async()=>{
  const tmp=await mkdtemp(path.join(tmpdir(),"smn-help-"));
  try{
   await mkdir(path.join(tmp,"es"));
   await writeFile(path.join(tmp,"es","overview.md"),"# Primeros pasos\n\nManual en español.");
   const result=await loadHelpContent("overview","es",user,"scrum",tmp);
   assert.equal(result.status,"ready");
   if(result.status==="ready"){
    assert.equal(result.contentLocale,"es");
    assert.equal(result.isFallback,false);
    assert.match(result.markdown,/Primeros pasos/);
   }
  }finally{await rm(tmp,{recursive:true,force:true});}
 });
 it("keeps long help bodies out of the global language catalogs",async()=>{
  const [fr,en]=await Promise.all(["fr","en"].map(x=>readFile(path.join("src/i18n",x+".json"),"utf8")));
  for(const body of ["First-time configuration of SMN","Première configuration de SMN","The Tickets module provides"]){
   assert.equal(fr.includes(body),false);
   assert.equal(en.includes(body),false);
  }
 });
});
describe("Safe Markdown rendering",()=>{
 it("renders semantic headings and lists while escaping raw HTML",()=>{
  const html=renderToStaticMarkup(createElement(SafeHelpMarkdown,
   {markdown:"# Heading\n\n- First\n- Second\n\n<script>alert(1)</script>"}));
  assert.match(html,/<h1>Heading<\/h1>/);
  assert.match(html,/<li>First<\/li>/);
  assert.doesNotMatch(html,/<script>/);
  assert.match(html,/&lt;script&gt;/);
 });
 it("only creates safe internal links, never javascript or external links",()=>{
  const html=renderToStaticMarkup(createElement(SafeHelpMarkdown,
   {markdown:"[Paramètres](/app/admin/settings) [Attack](javascript:alert) [External](https://example.com)"}));
  assert.match(html,/href="\/app\/admin\/settings"/);
  assert.doesNotMatch(html,/href="javascript:|href="https:/);
  assert.match(html,/Attack/);
 });
});
