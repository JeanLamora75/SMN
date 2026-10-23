import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {calculateSprint} from "../src/server/sprints/creation";
import {validBatchRequest} from "../src/server/sprints/batch-preview";

const cadence={
 duration_weeks:2,start_day:1,start_time:"09:00",end_day:5,end_time:"17:00",time_zone:"Europe/Paris"
};

describe("Refonte Sprints — repères calendaires et contrat de prévisualisation",()=>{
 it("conserve les heures locales d'une cadence chevauchant le changement d'heure d'octobre",()=>{
  const sprint=calculateSprint("2026-10-19",cadence);
  assert.deepEqual(sprint,{
   startOn:"2026-10-19",
   endOn:"2026-10-30",
   startAt:"2026-10-19T07:00:00.000Z",
   endAt:"2026-10-30T16:00:00.000Z",
   timeZone:"Europe/Paris"
  });
 });
 it("propose le prochain lundi, et non un instant arbitraire au milieu de semaine",()=>{
  const sprint=calculateSprint("2026-10-20",cadence);
  assert.equal(sprint.startOn,"2026-10-26");
  assert.equal(sprint.endOn,"2026-11-06");
  assert.equal(sprint.startAt,"2026-10-26T08:00:00.000Z");
  assert.equal(sprint.endAt,"2026-11-06T16:00:00.000Z");
 });
 it("valide le périmètre 1 à 6 sprints et rejette les requêtes invalides",()=>{
  for(let count=1;count<=6;count++)
   assert.equal(validBatchRequest({startOn:"2026-11-02",count}),true);
  for(const bad of [
   {startOn:"2026-11-02",count:0},
   {startOn:"2026-11-02",count:7},
   {startOn:"2026-11-02",count:1.5},
   {startOn:"2026-02-30",count:2},
   {startOn:"2026-11-02",count:2,teamId:"other"},
   {startOn:"2026-11-02",count:"2"},
   null,
   []
  ])assert.equal(validBatchRequest(bad),false);
 });
});
