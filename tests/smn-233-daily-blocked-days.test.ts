import assert from "node:assert/strict";
import {test} from "node:test";
import {planSprintTemplateOccurrences} from "../src/server/sprints/template-working-boundaries";

test("Daily : exclut les fermetures et jours fériés communs de l'équipe",()=>{
 const sprint={
  id:"sprint-test",
  startAt:"2026-11-09T08:00:00.000Z",
  endAt:"2026-11-13T17:00:00.000Z",
  timeZone:"Europe/Paris"
 };
 const templates=[{
  id:"daily",name:"Daily",frequency:"daily" as const,
  weekday:null,position:null,time:"09:30",duration:15,revision:1
 }];
 const blocked=new Set(["2026-11-11","2026-11-12"]);
 const occurrences=planSprintTemplateOccurrences(sprint,templates,undefined,blocked);
 assert.equal(occurrences.length,3);
 const days=occurrences.map(x=>new Intl.DateTimeFormat("sv-SE",{
  timeZone:"Europe/Paris",year:"numeric",month:"2-digit",day:"2-digit"
 }).format(new Date(x.startAt)));
 assert.deepEqual(days,["2026-11-09","2026-11-10","2026-11-13"]);
});
