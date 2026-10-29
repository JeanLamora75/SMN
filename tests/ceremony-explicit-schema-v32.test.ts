import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("Cérémonies: SQL déplacé hors des trois services métier",()=>{
 for(const p of ["ceremonies.ts","ceremony-templates.ts","lunch.ts","ceremony-edits.ts","exceptional-meetings.ts","template-occurrences.ts","attendance.ts","actual-duration.ts","calendar-meeting-reschedule.ts"]){
  const s=read("src/server/sprints/"+p);
  assert.doesNotMatch(s,/\b(?:CREATE|ALTER|DROP|TRUNCATE)\s+(?:TABLE|INDEX)\b/i,p);
  assert.match(s,/ceremony-schema-not-ready/);
 }
});
test("Cérémonies: migration explicite, additive, transactionnelle v32",()=>{
 const m=read("scripts/apply-ceremony-schema-v32.ts");
 for(const name of ["smn_sprint_ceremony","smn_sprint_ceremony_segment","smn_scrum_ceremony_template","smn_scrum_ceremony_template_history","smn_scrum_lunch","smn_sprint_ceremony_history","smn_sprint_exceptional_meeting","smn_sprint_exceptional_meeting_history","smn_scrum_template_occurrence","smn_sprint_ceremony_status_history","smn_scrum_template_occurrence_status_history","smn_sprint_exceptional_meeting_status_history","smn_meeting_actual_duration_audit","smn_calendar_meeting_schedule_history"])
  assert.ok(m.includes(name),name);
 assert.match(m,/schema_version!==32/);
 assert.match(m,/ROLLBACK/);
 assert.doesNotMatch(m,/\b(?:DROP|TRUNCATE|DELETE FROM)\b/i);
});
