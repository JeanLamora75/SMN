import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {describe,it} from "node:test";
import {helpSetupStepIds,helpSetupSteps,parseHelpSetupProgress} from "../src/lib/help-setup";
import {helpCatalog} from "../src/lib/help-catalog";
import {loadHelpContent} from "../src/server/help-content";
import {buildHelpIndexes} from "../scripts/build-help-index.mjs";

const root=path.resolve("content/help");
const admin={role:"admin",is_active:true,must_change_password:false};
const user={role:"user",is_active:true,must_change_password:false};
const stages=["general","team","members","calendar","cadence","tickets","reports","backup"] as const;
const files=(locale:string)=>readFile(path.join(root,locale,"overview.md"),"utf8");

describe("Camille + Sally — eight-step first-time configuration journey",()=>{
 it("starts after sign-in, provides eight sequenced steps in FR and EN and never explains installation",async()=>{
  assert.deepEqual([...helpSetupStepIds],stages);
  for(const locale of ["fr","en"] as const){
   const doc=await files(locale);
   const headers=[...doc.matchAll(/^## (?:Étape|Step) ([1-8])\s+[—-]\s+([^\n]+)/gm)];
   assert.equal(headers.length,8,locale+": exactly 8 user steps");
   assert.deepEqual(headers.map(m=>Number(m[1])),[1,2,3,4,5,6,7,8]);
   assert.doesNotMatch(doc,/^## (?:Avant la connexion|Before signing in)/im);
   assert.doesNotMatch(doc,locale==="fr"?/Installez SMN depuis sa distribution Windows/i:/Install SMN from the Windows distribution/i);
   assert.ok(doc.length>6500);
  }
 });
 it("explains the rationale, the action, how SMN uses the information and the verification for every step",async()=>{
  for(const locale of ["fr","en"] as const){
   const doc=await files(locale);
   const headers=[...doc.matchAll(/^## (?:Étape|Step) [1-8][^\n]*$/gm)];
   for(let index=0;index<headers.length;index++){
    const start=headers[index].index!;
    const end=index===headers.length-1?doc.indexOf("\n## ",start+1):headers[index+1].index!;
    const section=doc.slice(start,end<0?doc.length:end);
    for(const kind of (locale==="fr"
      ? ["**Pourquoi ?**","**À faire","**Ce que SMN en fait :**","**À vérifier"]
      : ["**Why?**","**What to do","**How SMN uses it:**","**Check"])){
     assert.ok(section.includes(kind),locale+"/"+(index+1)+" missing "+kind);
    }
   }
  }
 });
 it("separates Scrum and Kanban branches and distinguishes admin tasks from user reading",async()=>{
  for(const locale of ["fr","en"] as const){
   const doc=await files(locale);
   for(const fragment of locale==="fr"
    ?["équipe Scrum","équipe Kanban","administrateur","membres","absences","id,type,resume,priority,status,sp","sauvegarde"]
    :["Scrum team","Kanban team","administrator","members","absences","id,type,resume,priority,status,sp","backup"]){
    assert.ok(doc.toLowerCase().includes(fragment.toLowerCase()),locale+": "+fragment);
   }
   for(const link of [...doc.matchAll(/\]\((\/app[^)\s]+)\)/g)].map(m=>m[1])){
    assert.ok(["/app/team-calendar","/app/tickets","/app/reports"].includes(link),
     locale+": onboarding links to inaccessible screen "+link);
   }
  }
 });
 it("uses existing dedicated help pages rather than creating duplicated pages and preserves progress",async()=>{
  for(const mode of ["scrum","kanban"] as const){
   const adminSteps=helpSetupSteps(helpCatalog(admin,mode),mode);
   assert.deepEqual(adminSteps.map(x=>x.id),stages);
   assert.equal(adminSteps.find(x=>x.id==="cadence")?.articleId,mode==="scrum"?"sprints":"kanban-periods");
   const userSteps=helpSetupSteps(helpCatalog(user,mode),mode);
   assert.ok(!userSteps.some(x=>["general","team","members","backup"].includes(x.id)));
   for(const step of adminSteps){
    for(const locale of ["fr","en"] as const){
     const result=await loadHelpContent(step.articleId,locale,admin,mode,root);
     assert.equal(result.status,"ready",locale+"/"+step.id);
    }
   }
  }
  assert.deepEqual(parseHelpSetupProgress('{"version":1,"steps":{"team":"done","calendar":"in_progress"}}'),
   {team:"done",calendar:"in_progress"});
 });
 it("checks existing teams and members before proposing conditional creation",async()=>{
  const install=await readFile("src/server/installation/install.ts","utf8");
  assert.match(install,/INSERT INTO public\.smn_account/);
  assert.doesNotMatch(install,/INSERT INTO public\.smn_team\s*\(/);
  assert.doesNotMatch(install,/INSERT INTO public\.smn_member\s*\(/);
  const teamEditor=await readFile("src/app/app/admin/settings/teams/teams-settings.tsx","utf8");
  assert.match(teamEditor,/const valuesFrom=\(team:Team\)/);
  assert.match(teamEditor,/teamSettings\.editTeam/);
  assert.match(teamEditor,/teamSettings\.newTeam/);
  for(const locale of ["fr","en"] as const){
   const guide=await files(locale);
   const teamGuide=await readFile(path.join(root,locale,"teams.md"),"utf8");
   const membersGuide=await readFile(path.join(root,locale,"members.md"),"utf8");
   const step2=guide.slice(guide.indexOf(locale==="fr"?"## Étape 2":"## Step 2"),guide.indexOf(locale==="fr"?"## Étape 3":"## Step 3"));
   const step3=guide.slice(guide.indexOf(locale==="fr"?"## Étape 3":"## Step 3"),guide.indexOf(locale==="fr"?"## Étape 4":"## Step 4"));
   assert.match(step2,locale==="fr"?/équipe est déjà présente/:/team already exists/);
   assert.match(step2,locale==="fr"?/aucune équipe utilisable/:/no usable team/);
   assert.match(step3,locale==="fr"?/membres déjà présents/:/existing members first/);
   assert.match(step3,locale==="fr"?/uniquement si une personne manque/:/only if someone is missing/);
   assert.match(teamGuide,locale==="fr"?/personnalis/i:/customiz/i);
   assert.match(membersGuide,locale==="fr"?/doublon/:/duplicate/);
  }
  const copy=await readFile("src/app/app/help/help-setup-copy.ts","utf8");
  assert.match(copy,/Vérifier et personnaliser l’équipe/);
  assert.match(copy,/Review and customize the team/);
 });
 it("keeps both language-specific indexes synchronized",async()=>{
  assert.deepEqual((await buildHelpIndexes({check:true})).map(x=>x.locale),["en","fr"]);
 });
});
