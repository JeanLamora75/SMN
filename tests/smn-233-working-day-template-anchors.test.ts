import assert from "node:assert/strict";
import {test} from "node:test";
import {planTemplateOccurrences,type OccurrenceTemplate,type TemplateSprint} from "../src/server/sprints/template-occurrences";

const zone="Europe/Paris";
const slots={morningStart:"09:00",morningEnd:"12:00",afternoonStart:"13:00",afternoonEnd:"18:00"};
const sprint:TemplateSprint={
 id:"sprint-2026-nov",
 startAt:"2026-11-09T08:00:00.000Z", // lundi 09:00 Paris
 endAt:"2026-11-22T22:59:00.000Z", // dimanche 23:59 Paris
 timeZone:zone
};
const template=(name:string,position:"start"|"end",time:string,duration=60):OccurrenceTemplate=>({
 id:name,name,frequency:"sprint",weekday:null,position,time,duration,revision:1
});
const local=(date:string)=>new Intl.DateTimeFormat("fr-FR",{
 timeZone:zone,weekday:"long",day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit",hourCycle:"h23"
}).format(new Date(date));

test("la fin calendaire du dimanche place Review et Rétro le vendredi 20 novembre",()=>{
 const items=planTemplateOccurrences(sprint,[
  template("Sprint Planning","start","09:30",120),
  template("Sprint Review","end","15:00"),
  template("Sprint Retrospective","end","16:30")
 ],new Set(["2026-11-11"]),slots);
 assert.equal(items.length,3);
 const [planning,review,retro]=items;
 assert.match(local(planning.startsAt),/09\/11\/2026/);
 assert.match(local(planning.startsAt),/09:30/);
 for(const item of [review,retro]){
  assert.match(local(item.startsAt),/20\/11\/2026/);
  assert.doesNotMatch(local(item.startsAt),/dimanche|22\/11\/2026/);
 }
 assert.match(local(review.startsAt),/15:00/);
 assert.match(local(retro.startsAt),/16:30/);
 assert.ok(Date.parse(review.endsAt)<=Date.parse(retro.startsAt));
});

test("férié et fermeture le dernier vendredi => ancrage jeudi (ou mercredi)",()=>{
 const review=template("Sprint Review","end","15:00");
 assert.match(local(planTemplateOccurrences(sprint,[review],new Set(["2026-11-20"]),slots)[0].startsAt),/19\/11\/2026/);
 assert.match(local(planTemplateOccurrences(sprint,[review],new Set(["2026-11-20","2026-11-19"]),slots)[0].startsAt),/18\/11\/2026/);
});

test("fin un samedi, dimanche ou lundi 00:00 => dernier jour ouvré de la période",()=>{
 for(const endAt of ["2026-11-21T18:00:00Z","2026-11-22T22:59:00Z","2026-11-22T23:00:00Z"]){
  const items=planTemplateOccurrences({...sprint,endAt},[template("Review","end","15:00")],new Set(),slots);
  assert.match(local(items[0].startsAt),/20\/11\/2026/);
 }
});

test("daily évite le week-end et les jours fériés et respecte les heures configurées",()=>{
 const daily:OccurrenceTemplate={...template("Daily Scrum","start","09:00",15),
  frequency:"daily",position:null};
 const items=planTemplateOccurrences(sprint,[daily],new Set(["2026-11-11"]),slots);
 assert.equal(items.length,9); // 10 jours du lundi au vendredi, moins l'Armistice
 assert.ok(items.every(i=>!local(i.startsAt).includes("samedi")&&!local(i.startsAt).includes("dimanche")));
 assert.ok(items.every(i=>local(i.startsAt).includes("09:00")));
});

test("une réunion hebdomadaire fixée le dimanche reste une décision explicite de l'admin",()=>{
 const meeting:OccurrenceTemplate={...template("Maintenance","start","11:00",30),
  frequency:"weekly",weekday:7,position:null};
 const items=planTemplateOccurrences(sprint,[meeting],new Set(),slots);
 assert.equal(items.length,2);
 assert.ok(items.every(i=>local(i.startsAt).includes("dimanche")));
});

test("un modèle début/fin hors créneau est repositionné dans les plages configurées",()=>{
 const items=planTemplateOccurrences(sprint,[
  template("Start","start","06:00",60),
  template("End","end","22:00",60)
 ],new Set(),slots);
 assert.match(local(items[0].startsAt),/09\/11\/2026.*09:00/);
 assert.match(local(items[1].startsAt),/20\/11\/2026.*17:00/);
});

test("les réunions de début/fin restent dans le Sprint et respectent le changement d'heure",()=>{
 const spring:TemplateSprint={
  id:"spring",startAt:"2027-03-22T08:00:00Z",endAt:"2027-04-04T21:59:00Z",
  timeZone:zone
 };
 const events=planTemplateOccurrences(spring,[
  template("Planning","start","09:00",60),
  template("Review","end","16:00",60)
 ],new Set(),slots);
 assert.equal(events.length,2);
 const dates=events.map(x=>local(x.startsAt));
 assert.match(dates[0],/22\/03\/2027.*09:00/);
 assert.match(dates[1],/02\/04\/2027.*16:00/);
 assert.ok(events.every(i=>i.startsAt>=spring.startAt&&i.endsAt<=spring.endAt));
});

test("sans plages horaires configurées, conserver les heures des modèles et corriger les dates",()=>{
 const events=planTemplateOccurrences(sprint,[template("Review","end","15:00")],new Set(),null);
 assert.match(local(events[0].startsAt),/20\/11\/2026.*15:00/);
});

test("le premier jour ouvré après une fermeture accueille le Planning",()=>{
 const p=template("Sprint Planning","start","09:30",120);
 const planned=planTemplateOccurrences(sprint,[p],new Set(["2026-11-09"]),slots);
 assert.equal(planned.length,1);
 assert.match(local(planned[0].startsAt),/10\\/11\\/2026.*09:30/);
});

test("absence de jour ouvré : refus explicite pour les modèles ancrés",()=>{
 const one:TemplateSprint={id:"weekend-only",startAt:"2026-11-21T08:00:00Z",
  endAt:"2026-11-22T21:59:00Z",timeZone:zone};
 assert.throws(()=>planTemplateOccurrences(one,[template("Retro","end","16:30")],new Set(),slots),
  /template-no-working-day/);
});

test("désactivation de tous les modèles : aucune occurrence, même si le Sprint finit dimanche",()=>{
 assert.deepEqual(planTemplateOccurrences(sprint,[],new Set(),slots),[]);
});
