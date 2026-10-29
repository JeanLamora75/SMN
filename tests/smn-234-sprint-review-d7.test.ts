import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {readFileSync} from "node:fs";
import type {Client} from "pg";
import {
 cleanReviewBody,emptyReview,parseReviewEntry,REVIEW_MAX_LENGTH
} from "../src/lib/sprint-review-analysis";
import {readSprintReview,writeSprintReview}
 from "../src/server/sprints/review-analysis";

const sprintId="123e4567-e89b-42d3-a456-426614174000";
const team="team-1";
const row=(kind:"manual"|"ai",revision=2)=>({
 kind,body:kind==="manual"?"Bilan humain":"Note manuelle dans la zone IA",
 revision,origin:"human",humanEdited:true,generationId:null,
 updatedAt:"2026-10-23T13:00:00Z",updatedBy:"admin-1",
 updatedByName:"ScrumMaster"
});
const fake=(answer:(sql:string,args?:readonly unknown[])=>{rows:unknown[]})=>{
 const calls:{sql:string;args?:readonly unknown[]}[]=[];
 return {
  db:{query:async(sql:string,args?:readonly unknown[])=>{
   calls.push({sql,args});
   if(sql.startsWith("SELECT to_regclass(\'public.smn_sprint_review_analysis")&&sql.endsWith(" AS present"))return {rows:[{present:"migrated"}]};
   return answer(sql,args);
  }} as unknown as Client,
  calls
 };
};
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

describe("SMN-234 D7 — invariants de version et de provenance",()=>{
 it("maintient deux champs indépendants et un champ vide distinct d'une erreur",()=>{
  assert.deepEqual(emptyReview("manual").body,null);
  assert.deepEqual(emptyReview("ai").revision,0);
  assert.equal(cleanReviewBody("  Une analyse  "),"Une analyse");
  assert.equal(cleanReviewBody("   "),null);
  assert.equal(cleanReviewBody("x".repeat(REVIEW_MAX_LENGTH+1)),undefined);
 });
 it("rejette les fausses générations et les snapshots malformés",()=>{
  assert.equal(parseReviewEntry("ai",{...row("manual"),kind:"manual"}),null);
  assert.equal(parseReviewEntry("ai",{...row("ai"),origin:"robotique"}),null);
  assert.equal(parseReviewEntry("ai",{...row("ai"),revision:0}),null);
  assert.equal(parseReviewEntry("ai",row("ai"))?.origin,"human");
  assert.equal(parseReviewEntry("ai",row("ai"))?.updatedByName,"ScrumMaster");
 });
});
describe("SMN-234 D7 — SELECT autorisé / clôtures figées",()=>{
 it("refuse un Sprint hors de l'équipe avant toute lecture du Bilan",async()=>{
  const f=fake(()=>({rows:[]}));
  assert.equal(await readSprintReview(f.db,team,sprintId),null);
  assert.equal(f.calls.length,1);
  assert.deepEqual(f.calls[0].args,[sprintId,team]);
 });
 it("sans table optionnelle, les deux analyses ouvertes sont simplement non renseignées",async()=>{
  const f=fake(sql=>sql.includes("SELECT s.status")?{rows:[{status:"active"}]}:
   {rows:[{present:false}]});
  const result=await readSprintReview(f.db,team,sprintId);
  assert.equal(result?.state,"available");
  if(result?.state==="available"){
   assert.equal(result.manual.revision,0);
   assert.equal(result.ai.body,null);
  }
  assert.ok(f.calls.every(x=>/^\s*SELECT/i.test(x.sql)));
 });
 it("lit les deux analyses et leurs révisions indépendantes en cours de Sprint",async()=>{
  const f=fake(sql=>sql.includes("SELECT s.status")?{rows:[{status:"active"}]}:
   sql.includes("to_regclass")?{rows:[{present:true}]}:
   {rows:[row("manual",3),row("ai",1)]});
  const result=await readSprintReview(f.db,team,sprintId);
  assert.equal(result?.state,"available");
  if(result?.state==="available"){
   assert.equal(result.manual.revision,3);
   assert.equal(result.ai.revision,1);
   assert.equal(result.manual.updatedByName,"ScrumMaster");
   assert.equal(result.source,"current");
  }
 });
 it("en Sprint clôturé, n'utilise jamais la table des analyses courantes",async()=>{
  const f=fake(sql=>{
   if(sql.includes("SELECT s.status"))return {rows:[{status:"closed"}]};
   if(sql.includes("to_regclass"))return {rows:[{present:true}]};
   if(sql.includes("SELECT version,snapshot"))return {rows:[{version:2,snapshot:{
    reviewAnalysis:{manual:row("manual"),ai:row("ai")}
   }}]};
   throw Error("Forbidden current-table read: "+sql);
  });
  const r=await readSprintReview(f.db,team,sprintId);
  assert.equal(r?.state,"available");
  if(r?.state==="available"){
   assert.equal(r.snapshotVersion,2);
   assert.equal(r.source,"closure-snapshot");
   assert.equal(r.ai.revision,2);
  }
 });
 it("un ancien snapshot sans Bilan est déclaré indisponible, pas recalculé",async()=>{
  const f=fake(sql=>sql.includes("SELECT s.status")?{rows:[{status:"closed"}]}:
   sql.includes("to_regclass")?{rows:[{present:true}]}:
   {rows:[{version:1,snapshot:{goals:[]}}]});
  assert.deepEqual(await readSprintReview(f.db,team,sprintId),
   {state:"unavailable",reason:"history-missing"});
  assert.ok(f.calls.every(x=>!x.sql.includes("LEFT JOIN public.smn_account")));
 });
});
describe("SMN-234 D7 — sauvegarde, audit, conflits et sécurité",()=>{
 it("rejette le texte hors limites sans lancer la moindre requête",async()=>{
  const f=fake(()=>({rows:[]}));
  assert.deepEqual(await writeSprintReview(f.db,"admin",{
   sprintId,kind:"ai",revision:0,body:"x".repeat(REVIEW_MAX_LENGTH+1)
  }),{ok:false,error:"invalid-input"});
  assert.equal(f.calls.length,0);
 });
 it("verrouille le Sprint et refuse une clôture sans créer de table",async()=>{
  const f=fake(sql=>sql.includes("SELECT s.id,s.status")?
   {rows:[{id:sprintId,status:"closed"}]}:{rows:[]});
  const result=await writeSprintReview(f.db,"admin",{
   sprintId,kind:"manual",revision:0,body:"Bilan"
  });
  assert.deepEqual(result,{ok:false,error:"closed-period"});
  assert.ok(!f.calls.some(x=>/CREATE TABLE|INSERT INTO/.test(x.sql)));
 });
 it("crée une première révision humaine, avec trace d'audit indépendante",async()=>{
  const f=fake(sql=>sql.includes("SELECT s.id,s.status")?
   {rows:[{id:sprintId,status:"active"}]}:
   sql.includes("SELECT r.kind")?{rows:[]}:{rows:[]});
  const result=await writeSprintReview(f.db,"admin",{
   sprintId,kind:"ai",revision:0,body:"Texte saisi manuellement"
  });
  assert.deepEqual(result,{ok:true,revision:1,unchanged:false});
  assert.ok(f.calls.some(x=>x.sql.includes("INSERT INTO public.smn_sprint_review_analysis\n")));
  assert.ok(f.calls.some(x=>x.sql.includes("INSERT INTO public.smn_sprint_review_analysis_audit")));
  const audit=f.calls.find(x=>x.sql.includes("INSERT INTO public.smn_sprint_review_analysis_audit"));
  assert.equal(audit?.args?.[2],"ai");
  assert.equal(JSON.parse(audit?.args?.[4] as string).origin,"human");
  assert.ok(f.calls.some(x=>x.sql==="COMMIT"));
 });
 it("ne modifie pas l'autre bloc, et refuse une ancienne révision",async()=>{
  const f=fake(sql=>sql.includes("SELECT s.id,s.status")?
   {rows:[{id:sprintId,status:"active"}]}:
   sql.includes("SELECT r.kind")?{rows:[row("manual",3),row("ai",1)]}:{rows:[]});
  assert.deepEqual(await writeSprintReview(f.db,"admin",{
   sprintId,kind:"manual",revision:2,body:"Texte périmé"
  }),{ok:false,error:"conflict"});
  assert.ok(!f.calls.some(x=>x.sql.includes("UPDATE public.smn_sprint_review_analysis")));
  assert.ok(f.calls.some(x=>x.sql==="ROLLBACK"));
 });
 it("le serveur impose le droit admin et ne propose aucune génération IA",()=>{
  const route=read("src/app/api/admin/sprints/review-analysis/route.ts");
  const page=read("src/app/app/admin/sprints/[sprintId]/page.tsx");
  const panel=read("src/app/app/admin/sprints/[sprintId]/sprint-review-panel.tsx");
  const closure=read("src/server/sprints/closure.ts");
  assert.match(route,/authorizeApi\(req,"write",resource\)/);
  assert.match(page,/active==="review"\?await readSprintReview\(db,teamId,cycle.id\)/);
  assert.match(panel,/canManage&&status!=="closed"/);
  assert.match(panel,/method:"PUT"/);
  assert.match(closure,/reviewAnalysis,/);
  assert.doesNotMatch(panel,/fetch\(["']\/api\/ai/);
 });
});
