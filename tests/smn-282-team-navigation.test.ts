import assert from "node:assert/strict";
import {test} from "node:test";
import {teamSwitchDestination} from "../src/lib/team-navigation";

test("même rubrique conservée et fiche repliée sur la liste cible",()=>{
 assert.equal(teamSwitchDestination("/app/admin/registries/risk-123","team_b","scrum"),
  "/app/admin/registries?teamId=team_b");
 assert.equal(teamSwitchDestination("/app/team-calendar/day/2026-10-26","team_b","kanban"),
  "/app/team-calendar?teamId=team_b");
 assert.equal(teamSwitchDestination("/app/reports/report_7","team_b","scrum"),
  "/app/reports?teamId=team_b");
 assert.equal(teamSwitchDestination("/app/admin/members/member_3","team_b","scrum"),
  "/app/admin/members?teamId=team_b");
 assert.equal(teamSwitchDestination("/app/admin/settings/teams","team_b","scrum"),
  "/app/admin/settings/teams?teamId=team_b");
});
test("cycle Scrum dans son mode uniquement ; Kanban vers tableau de bord",()=>{
 assert.equal(teamSwitchDestination("/app/admin/sprints/sprint_4","team_b","scrum"),
  "/app/admin/sprints?teamId=team_b");
 assert.equal(teamSwitchDestination("/app/admin/sprints/sprint_4","team_b","kanban"),
  "/app?teamId=team_b");
});
test("retour sûr pour route inconnue et id illégal",()=>{
 assert.equal(teamSwitchDestination("https://example.test/login","team_b","scrum"),
  "/app?teamId=team_b");
 assert.equal(teamSwitchDestination("/app/admin/members/123","../other","scrum"),
  "/app");
 assert.equal(teamSwitchDestination("/app/admin/members/123?teamId=team_a","team_b","scrum"),
  "/app?teamId=team_b");
});
test("aucun filtre, cycle ni version de l'équipe source n'est propagé",()=>{
 const to=teamSwitchDestination("/app","target","scrum");
 const url=new URL(to,"http://smn.local");
 assert.equal(url.searchParams.get("teamId"),"target");
 assert.equal(url.searchParams.get("cycleId"),null);
 assert.equal(url.searchParams.get("filter"),null);
 assert.equal(url.searchParams.get("version"),null);
});
