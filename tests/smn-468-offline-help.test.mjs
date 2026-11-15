import {test} from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,cp,rm,readFile,writeFile,unlink} from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {verifyOfflineHelp,REQUIRED_HELP_ARTICLES} from "../scripts/windows/verify-offline-help.mjs";

const source=path.resolve("content/help");
test("SMN-468 — source documentary assets have complete FR/EN coverage and fresh indexes",async()=>{
 const proof=await verifyOfflineHelp(source);
 assert.deepEqual(proof.locales,["fr","en"]);
 assert.equal(proof.articleCount,REQUIRED_HELP_ARTICLES.length);
 assert.ok(REQUIRED_HELP_ARTICLES.includes("tickets"));
 assert.ok(REQUIRED_HELP_ARTICLES.includes("faq"));
 assert.equal(proof.articleCount,32,"La distribution doit transporter tous les guides FR/EN actuellement publiés");
 for(const required of ["sprint-page","maintenance-settings","capacity-settings","chart-styles-settings"]){
  assert.ok(REQUIRED_HELP_ARTICLES.includes(required),"Guide récent non inclus : "+required);
 }

});
test("SMN-468 — a Windows-like app/content/help payload remains readable without network",async()=>{
 const temp=await mkdtemp(path.join(os.tmpdir(),"smn-help-offline-"));
 try{
  const installed=path.join(temp,"app","content","help");
  await cp(source,installed,{recursive:true});
  assert.equal((await verifyOfflineHelp(installed)).articleCount,REQUIRED_HELP_ARTICLES.length);
  const article=await readFile(path.join(installed,"fr","tickets.md"),"utf8");
  const index=JSON.parse(await readFile(path.join(installed,".index","fr.json"),"utf8"));
  assert.match(article,/id,type,resume,priority,status,sp/);
  assert.ok(index.articles.some(row=>row.id==="tickets"));
 }finally{await rm(temp,{recursive:true,force:true});}
});
test("SMN-468 — missing articles and missing or stale indexes block packaging",async()=>{
 const temp=await mkdtemp(path.join(os.tmpdir(),"smn-help-broken-"));
 try{
  const installed=path.join(temp,"app","content","help");
  await cp(source,installed,{recursive:true});
  await unlink(path.join(installed,"en","tickets.md"));
  await assert.rejects(verifyOfflineHelp(installed),/help-package-article-coverage-invalid/);
  await cp(source,installed,{recursive:true,force:true});
  await unlink(path.join(installed,".index","en.json"));
  await assert.rejects(verifyOfflineHelp(installed),/ENOENT/);
  await cp(source,installed,{recursive:true,force:true});
  await writeFile(path.join(installed,"fr","overview.md"),"# Texte périmé\n\nCe document a été modifié volontairement et contient assez de texte pour dépasser le seuil minimal de taille tout en rendant son index de recherche obsolète.");
  await assert.rejects(verifyOfflineHelp(installed),/help-package-index-stale/);
 }finally{await rm(temp,{recursive:true,force:true});}
});
test("SMN-468 — application packaging uses local help only and checks installed files",async()=>{
 const packageSource=await readFile("scripts/windows/package-portable.mjs","utf8");
 const verifySource=await readFile("scripts/windows/verify-package.mjs","utf8");
 for(const text of [packageSource,verifySource])
  assert.match(text,/verifyOfflineHelp\(/);
 assert.match(packageSource,/await cp\(helpSource,path\.join\(appDir,"content","help"\)/);
 assert.match(verifySource,/path\.join\(root,"app","content","help"\)/);
 for(const target of ["src/server/help-content.ts","src/server/help-search.ts","src/server/help-available.ts"]){
  const text=await readFile(target,"utf8");
  assert.match(text,/helpResourcesRoot\(/);
 }
 const resolver=await readFile("src/server/help-path.ts","utf8");
 assert.match(resolver,/path\.join\(cwd,"app","content","help"\)/);
 assert.doesNotMatch(resolver,/fetch\(|https?:\/\//);
});
