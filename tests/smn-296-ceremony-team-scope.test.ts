import {test} from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {saveTemplateOccurrences} from "../src/server/sprints/template-occurrences";

test("la génération refuse un Sprint d'une autre équipe avant de lire les modèles",async()=>{
 const sql:string[]=[];
 const db={query:async(statement:string)=>{
  sql.push(statement);
  if(statement.includes("SELECT team_id FROM public.smn_sprint"))return {rows:[{team_id:"team_b"}]};
  return {rows:[],rowCount:0};
 }} as unknown as Client;
 await assert.rejects(()=>saveTemplateOccurrences(db,{
  id:"sprint_b",startAt:"2026-11-02T08:00:00.000Z",endAt:"2026-11-13T17:00:00.000Z",
  timeZone:"Europe/Paris"
 },{expectedTeamId:"team_a"}),/sprint-team-scope-mismatch/);
 assert.equal(sql.some(s=>s.includes("FROM public.smn_scrum_ceremony_template")),false);
 assert.equal(sql.some(s=>s.includes("INSERT INTO public.smn_scrum_template_occurrence")),false);
});
