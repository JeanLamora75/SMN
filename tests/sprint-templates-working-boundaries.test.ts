import assert from "node:assert/strict";
import {describe,it} from "node:test";
import type {Client} from "pg";
import {planSprintTemplateOccurrences,saveTemplateOccurrences}
 from "../src/server/sprints/template-occurrences";
import {DEFAULT_SCRUM_CEREMONY_TEMPLATES} from "../src/server/sprints/ceremony-templates";

const zone="Europe/Paris";
const sprint={id:"s1",startAt:"2026-11-09T08:00:00.000Z",
 endAt:"2026-11-22T22:59:00.000Z",timeZone:zone};
const slots={morningStart:"09:00",morningEnd:"12:00",afternoonStart:"13:00",afternoonEnd:"18:00"};
const templates=DEFAULT_SCRUM_CEREMONY_TEMPLATES.map((v,i)=>({...v,id:"t"+i,revision:1}));
const local=(iso:string)=>new Intl.DateTimeFormat("sv-SE",{timeZone:zone,
 year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(new Date(iso));

describe("Cérémonies de sprint : premier et dernier jour/heure ouvrés",()=>{
 it("fin de sprint le dimanche : Review et Retro le vendredi avant la dernière heure",()=>{
  const list=planSprintTemplateOccurrences(sprint,templates,slots,new Set());
  const review=list.find(x=>x.name==="Sprint Review")!;
  const retro=list.find(x=>x.name==="Sprint Retrospective")!;
  assert.equal(local(review.startAt),"2026-11-20 15:00");
  assert.equal(local(review.endAt),"2026-11-20 16:00");
  assert.equal(local(retro.startAt),"2026-11-20 16:00");
  assert.equal(local(retro.endAt),"2026-11-20 17:00");
  assert.ok(list.every(x=>!["2026-11-21","2026-11-22"].includes(local(x.startAt).slice(0,10))));
 });
 it("début de sprint non ouvré : Planning au premier créneau ouvré disponible",()=>{
  const atypical={...sprint,startAt:"2026-11-07T08:00:00.000Z"};
  const list=planSprintTemplateOccurrences(atypical,templates,slots,new Set());
  assert.equal(local(list.find(x=>x.name==="Sprint Planning")!.startAt),"2026-11-09 09:30");
 });
 it("fermeture le vendredi : événements de fin reportés au jeudi",()=>{
  const list=planSprintTemplateOccurrences(sprint,templates,slots,new Set(["2026-11-20"]));
  assert.equal(local(list.find(x=>x.name==="Sprint Review")!.startAt),"2026-11-19 15:00");
  assert.equal(local(list.find(x=>x.name==="Sprint Retrospective")!.endAt),"2026-11-19 17:00");
  assert.ok(!list.some(x=>x.position==="end"&&local(x.startAt).startsWith("2026-11-20")));
 });
 it("jour férié collectif au début : planning reporté au mardi première heure",()=>{
  const list=planSprintTemplateOccurrences(sprint,templates,slots,new Set(["2026-11-09"]));
  assert.equal(local(list.find(x=>x.name==="Sprint Planning")!.startAt),"2026-11-10 09:30");
 });
 it("le modèle de début hors première heure est ramené à l'ouverture",()=>{
  const later=templates.map(x=>x.name==="Sprint Planning"?{...x,time:"14:00"}:x);
  const list=planSprintTemplateOccurrences(sprint,later,slots,new Set());
  assert.equal(local(list.find(x=>x.name==="Sprint Planning")!.startAt),"2026-11-09 09:00");
  assert.ok(list.some(x=>x.name==="Daily Scrum"&&local(x.startAt)==="2026-11-09 09:00")); // Récurrence existante préservée.
 });
 it("réunions hebdomadaires et Daily non repositionnées par la règle début/fin",()=>{
  const sunday={...templates[1],name:"Hebdo dimanche",frequency:"weekly" as const,weekday:7,time:"14:00"};
  const list=planSprintTemplateOccurrences(sprint,[...templates,sunday],slots,new Set(["2026-11-20"]));
  assert.ok(list.some(x=>x.name==="Hebdo dimanche"&&local(x.startAt)==="2026-11-22 14:00"));
  assert.ok(!list.some(x=>x.name==="Daily Scrum"&&local(x.startAt)==="2026-11-20 09:00")); // Pas de Daily un jour de fermeture collective.
  assert.ok(list.filter(x=>x.position==="end").every(x=>local(x.startAt).slice(0,10)==="2026-11-19"));
 });
 it("créneaux de travail modifiés : calcul relatif à l'équipe, sans horaire figé",()=>{
  const custom={morningStart:"08:00",morningEnd:"12:00",afternoonStart:"13:00",afternoonEnd:"17:00"};
  const list=planSprintTemplateOccurrences(sprint,templates,custom,new Set());
  assert.equal(local(list.find(x=>x.name==="Sprint Retrospective")!.endAt),"2026-11-20 16:00");
 });
 it("respecte le changement d'heure Europe/Paris et un calendrier complet",()=>{
  const april={...sprint,startAt:"2027-03-22T08:00:00Z",endAt:"2027-04-04T21:59:00Z"};
  const list=planSprintTemplateOccurrences(april,templates,slots,new Set());
  assert.equal(local(list.find(x=>x.name==="Sprint Review")!.startAt),"2027-04-02 15:00");
  assert.equal(local(list.find(x=>x.name==="Sprint Retrospective")!.endAt),"2027-04-02 17:00");
 });
 it("si aucune journée ouvrée n'existe, refuse le lot avant insertion",()=>{
  const allDays=Array.from({length:14},(_,i)=>
   new Date(Date.UTC(2026,10,9+i)).toISOString().slice(0,10));
  assert.throws(()=>planSprintTemplateOccurrences(sprint,templates,slots,new Set(allDays)),
   /sprint-no-working-day/);
 });
 it("un lot de 2 sprints conserve le calcul relatif à chacune des dates",()=>{
  const second={...sprint,startAt:"2026-11-23T08:00:00Z",endAt:"2026-12-06T22:59:00Z"};
  assert.equal(local(planSprintTemplateOccurrences(second,templates,slots,new Set())
   .find(x=>x.name==="Sprint Retrospective")!.endAt),"2026-12-04 17:00");
 });
});

describe("Intégration du générateur central (unitaire, lot, wizard)",()=>{
 it("utilise les créneaux d'équipe, fermetures et jours fériés collectifs",async()=>{
  const inserts:{sql:string;args:unknown[]}[]=[];
  const db={query:async(sql:string,args:unknown[]=[]):Promise<{rows:unknown[];rowCount:number}>=>{
   if(sql.includes("SELECT team_id FROM public.smn_sprint"))return {rows:[{team_id:"team-1"}],rowCount:1};
   if(sql.includes("WHERE team_id=$1 AND active=true"))return {rows:templates,rowCount:4};
   if(sql.includes("to_regclass('public.smn_team_work_slots')"))return {rows:[{present:false}],rowCount:1};
   if(sql.includes("FROM public.smn_company_closure"))return {rows:[{start_on:"2026-11-20",end_on:"2026-11-20"}],rowCount:1};
   if(sql.includes("FROM public.smn_member_assignment"))return {rows:[],rowCount:0};
   if(sql.includes("INSERT INTO public.smn_scrum_template_occurrence")){
    inserts.push({sql,args});return {rows:[{id:"new"}],rowCount:1};
   }
   return {rows:[],rowCount:0};
  }} as unknown as Client;
  const saved=await saveTemplateOccurrences(db,sprint);
  assert.ok(saved>0);
  const end=inserts.filter(x=>x.args[1]==="t2"||x.args[1]==="t3");
  assert.equal(end.length,2);
  assert.ok(end.every(x=>String(x.args[5]).startsWith("2026-11-19")));
 });
});
