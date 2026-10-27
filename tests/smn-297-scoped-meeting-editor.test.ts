import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("les réunions manuelles passent par la mutation contextualisée",()=>{
 const form=readFileSync("src/app/app/team-calendar/scoped-meeting-editor.tsx","utf8");
 const view=readFileSync("src/app/app/team-calendar/team-calendar-view.tsx","utf8");
 assert.ok(form.includes('"/api/admin/team-meetings/change"'));
 assert.ok(form.includes("teamId,kind:mode,meetingId:meeting.id"));
 assert.ok(form.includes("expectedStartAt:previousStart"));
 assert.ok(form.includes("expectedEndAt:previousEnd"));
 assert.ok(view.includes('selectedMeeting.kind==="exceptional"||selectedMeeting.kind==="kanban"'));
 assert.ok(view.includes("!initialTeamId&&selectedMeeting.kind"));
});
