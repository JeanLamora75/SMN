import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import type {Client} from "pg";
import {DEFAULT_SCRUM_CEREMONY_TEMPLATES,parseTemplate} from "../src/server/sprints/ceremony-templates";
import {saveGeneratedCeremonies} from "../src/server/sprints/ceremonies";

const source=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("quatre modèles initiaux simples et valides, tous configurables",()=>{
 assert.deepEqual(DEFAULT_SCRUM_CEREMONY_TEMPLATES.map(x=>x.name),[
  "Sprint Planning","Daily Scrum","Sprint Review","Sprint Retrospective"
 ]);
 for(const value of DEFAULT_SCRUM_CEREMONY_TEMPLATES)assert.deepEqual(parseTemplate(value),value);
});

test("création Sprint : seules les occurrences des modèles actifs sont enregistrées",async()=>{
 const inserts:Array<{sql:string;params:unknown[]}>=[],seen:string[]=[];
 const db={
  async query(sql:string,params:unknown[]=[]){
   seen.push(sql);
   if(sql.includes("array_agg(relname)")||sql.includes("array_agg(c.relname)"))return {rows:[{present:["smn_sprint_ceremony","smn_sprint_ceremony_segment","smn_scrum_template_occurrence","smn_scrum_ceremony_template","smn_scrum_ceremony_template_history"]}]};
   if(sql.includes("SELECT team_id FROM public.smn_sprint"))return {rows:[{team_id:"team"}],rowCount:1};
   if(sql.includes("WHERE team_id=$1 AND active=true")){
    return {rows:DEFAULT_SCRUM_CEREMONY_TEMPLATES.filter(x=>x.name!=="Sprint Planning").map((v,i)=>({
     ...v,id:"active-"+i,revision:1
    }))};
   }
   if(sql.includes("INSERT INTO public.smn_scrum_template_occurrence")){
    inserts.push({sql,params});return {rows:[{id:randomUUID()}],rowCount:1};
   }
   return {rows:[],rowCount:0};
  }
 } as unknown as Client;
 const count=await saveGeneratedCeremonies(db,{id:"sprint-1",
  startAt:"2026-11-02T08:00:00.000Z",endAt:"2026-11-13T17:00:00.000Z",
  timeZone:"Europe/Paris"},2);
 assert.equal(count,12); // 10 Daily (lundi-vendredi) + Review + Retro ; Planning désactivé.
 assert.equal(inserts.length,12);
 assert.ok(inserts.every(x=>x.sql.includes("smn_scrum_template_occurrence")));
 assert.ok(!seen.some(x=>x.includes("INSERT INTO public.smn_sprint_ceremony(")));
 assert.ok(seen.some(x=>x.includes("active=true")));
});

test("installation, migration additive et calendrier couvrent les modèles",()=>{
 const installation=source("src/server/installation/install.ts");
 const syncScript=source("scripts/sync-ceremony-templates.ts");
 const calendar=source("src/app/api/team-calendar/meetings/route.ts");
 const detail=source("src/app/app/team-calendar/meeting/[kind]/[id]/page.tsx");
 const conflicts=source("src/server/sprints/meeting-conflicts.ts");
 assert.match(installation,/if \(input\.mode === "scrum"\) \{/);
 assert.match(installation,/await seedDefaultScrumCeremonyTemplates/);
 assert.match(syncScript,/seedDefaultScrumCeremonyTemplates/);
 assert.match(syncScript,/installedDatabaseUri/);
 assert.doesNotMatch(syncScript,/(?:UPDATE|DELETE)\s+(?:FROM\s+)?public\.smn_sprint\b/i);
 assert.match(calendar,/smn_scrum_template_occurrence/);
 assert.match(calendar,/'template' AS kind/);
 assert.match(detail,/kind==="template"/);
 assert.match(conflicts,/smn_scrum_template_occurrence/);
});
