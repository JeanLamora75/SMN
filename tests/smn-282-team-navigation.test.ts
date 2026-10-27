import assert from "node:assert/strict";
import {test} from "node:test";
import {teamSwitchDestination} from "../src/lib/team-navigation";

test("changement d'équipe : toutes les pages métier reviennent au Cockpit",()=>{
 for(const route of [
  "/app/admin/registries/risk-123",
  "/app/team-calendar/day/2026-10-26",
  "/app/reports/report_7",
  "/app/admin/members/member_3",
  "/app/admin/settings/teams",
  "/app/admin/sprints/sprint_4",
  "/app/admin/kanban-periods/period_2"
 ]){
  for(const mode of ["scrum","kanban"] as const){
   assert.equal(teamSwitchDestination(route,"team_b",mode),"/app?teamId=team_b");
  }
 }
});

test("route inconnue et identifiant illégal : retour sans données héritées",()=>{
 assert.equal(teamSwitchDestination("https://example.test/login","team_b","scrum"),"/app?teamId=team_b");
 assert.equal(teamSwitchDestination("/app/admin/members/123","../other","scrum"),"/app");
});

test("aucun filtre, cycle ni version de l'équipe source n'est propagé",()=>{
 const to=teamSwitchDestination("/app?teamId=team_a&cycleId=s1&version=2&filter=active","target","kanban");
 const url=new URL(to,"http://smn.local");
 assert.equal(url.pathname,"/app");
 assert.equal(url.searchParams.get("teamId"),"target");
 assert.equal(url.searchParams.get("cycleId"),null);
 assert.equal(url.searchParams.get("filter"),null);
 assert.equal(url.searchParams.get("version"),null);
});
