import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parseTeamMeeting} from "../src/server/teams/meeting-create";

test("le formulaire calendrier oriente les créations par équipe vers l'API contextualisée",()=>{
 const source=readFileSync("src/app/app/team-calendar/team-calendar-view.tsx","utf8");
 assert.ok(source.includes('scoped?"/api/admin/team-meetings"'));
 assert.ok(source.includes("teamId:initialTeamId,kind:calendarMode,cycleId:"));
});
test("les événements contextualisés requièrent un cycle et une équipe explicites",()=>{
 const input={teamId:"team_a",kind:"scrum",cycleId:"sprint_a",name:"Réunion",duration:60,startAt:"2026-10-27T10:00:00.000Z"};
 assert.deepEqual(parseTeamMeeting(input),input);
 assert.equal(parseTeamMeeting({...input,teamId:""}),null);
 assert.equal(parseTeamMeeting({...input,cycleId:null}),null);
});
