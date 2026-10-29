import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {describe,it} from "node:test";
import {canAccess} from "../src/server/access-policy";

const source=(relative:string)=>readFileSync(new URL("../"+relative,import.meta.url),"utf8");
const actor=(role:"admin"|"user")=>({role,is_active:true,must_change_password:false});
const scope=(type:"settings"|"collective")=>({type,exists:true,inScope:true});

describe("Refonte Sprints — garde-fous métier avant déplacement UX",()=>{
 it("conserve les droits serveur : les réglages sont admin, les données collectives consultables",()=>{
  assert.equal(canAccess(actor("admin"),"read",scope("settings")),true);
  assert.equal(canAccess(actor("admin"),"write",scope("settings")),true);
  assert.equal(canAccess(actor("user"),"read",scope("settings")),false);
  assert.equal(canAccess(actor("user"),"write",scope("settings")),false);
  assert.equal(canAccess(actor("user"),"read",scope("collective")),true);
  assert.equal(canAccess(actor("user"),"write",scope("collective")),false);
 });
 it("préserve la vérification d'accès avant les handlers de mutation Sprints",()=>{
  const files=[
   "src/app/api/admin/sprints/route.ts",
   "src/app/api/admin/sprints/preview/route.ts",
   "src/app/api/admin/sprints/batch/route.ts",
   "src/app/api/admin/sprints/delete/route.ts",
   "src/app/api/admin/sprints/reschedule/route.ts",
   "src/app/api/admin/sprints/[id]/route.ts"
  ];
  for(const path of files){
   const code=source(path);
   assert.match(code,/authorizeApi\(/,path);
   assert.match(code,/forbidden/,path);
   assert.match(code,/403/,path);
   assert.match(code,/withAuthDb\(|withLegacyTeamApi\(/,path);
  }
 });
 it("ne perd pas les API de configuration lors du déplacement de leurs formulaires",()=>{
  const endpoints=[
   ["src/app/api/admin/sprints/work-slots/route.ts",["GET","PUT"]],
   ["src/app/api/admin/sprints/lunch/route.ts",["GET","PATCH"]],
   ["src/app/api/admin/sprints/templates/route.ts",["GET","POST"]]
  ] as const;
  for(const [path,methods] of endpoints){
   const code=source(path);
   for(const method of methods)assert.ok(code.includes("export async function "+method+"("),path+" "+method);
   assert.match(code,/authorizeApi\(/,path);
   assert.match(code,/withAuthDb\(|withLegacyTeamApi\(/,path);
  }
 });
 it("conserve la création unitaire transactionnelle avec contrôle de chevauchement",()=>{
  const code=source("src/server/sprints/creation.ts");
  for(const part of [
   'export async function createSprint(',
   'db.query("BEGIN")',
   'pg_advisory_xact_lock',
   '"overlap"',
   'saveGeneratedCeremonies(',
   'db.query("COMMIT")',
   'db.query("ROLLBACK")',
   'smn_sprint_audit'
  ])assert.ok(code.includes(part),part);
 });
 it("conserve les lots atomiques protégés par jeton et contrôle d'aperçu obsolète",()=>{
  const code=source("src/server/sprints/batch-confirm.ts");
  for(const part of [
   'export async function confirmBatch(',
   'db.query("BEGIN")',
   'FOR UPDATE',
   'pg_advisory_xact_lock',
   '"stale-preview"',
   'saveGeneratedCeremonies(',
   'db.query("COMMIT")',
   'db.query("ROLLBACK")'
  ])assert.ok(code.includes(part),part);
 });
 it("conserve suppression conditionnée au non-démarrage, audit et transaction",()=>{
  const code=source("src/server/sprints/deletion.ts");
  assert.match(code,/status!=="planned"/);
  assert.match(code,/start_at>now\(\)/);
  assert.match(code,/deleted_at=now\(\)/);
  assert.match(code,/smn_sprint_audit/);
  assert.match(code,/db\.query\("BEGIN"\)/);
  assert.match(code,/db\.query\("COMMIT"\)/);
  assert.match(code,/db\.query\("ROLLBACK"\)/);
 });
 it("conserve le duo aperçu/confirmation de replanification avec protection de l'historique",()=>{
  const code=source("src/server/sprints/reschedule.ts");
  for(const part of [
   "export async function previewReschedule(",
   "export async function confirmReschedule(",
   '"stale-preview"',
   '"events-outside-new-period"',
   'db.query("BEGIN")',
   'db.query("COMMIT")'
  ])assert.ok(code.includes(part),part);
  assert.match(code,/mode!=="keep"/);
 });
 it("conserve le renommage historique et le bilan accessible durant la transition",()=>{
  const rename=source("src/server/sprints/rename.ts");
  assert.match(rename,/smn_sprint_audit/);
  assert.match(rename,/previousName/);
  assert.match(rename,/newName/);
  const review=source("src/app/app/admin/sprints/review/page.tsx");
  for(const name of ["GoalsForm","StoryPointsForm","ReviewCapacity","SprintTrends","SprintClosure"])
   assert.ok(review.includes(name),name);
 });
});
