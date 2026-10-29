import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("Cérémonies: SQL déplacé hors des trois services métier",()=>{
 for(const p of ["ceremonies.ts","ceremony-templates.ts","lunch.ts","ceremony-edits.ts","exceptional-meetings.ts","template-occurrences.ts","attendance.ts","actual-duration.ts","calendar-meeting-reschedule.ts","exceptional-capacity-impact.ts","cadence.ts","batch-confirm.ts","calendar-meeting-outcomes.ts"]){
  const s=read("src/server/sprints/"+p);
  assert.doesNotMatch(s,/\b(?:CREATE|ALTER|DROP|TRUNCATE)\s+(?:TABLE|INDEX)\b/i,p);
  assert.match(s,/schema-not-ready/);
 }
});
test("Cérémonies: migration explicite, additive, transactionnelle v32",()=>{
 const m=read("scripts/apply-ceremony-schema-v32.ts");
 for(const name of ["smn_sprint_ceremony","smn_sprint_ceremony_segment","smn_scrum_ceremony_template","smn_scrum_ceremony_template_history","smn_scrum_lunch","smn_sprint_ceremony_history","smn_sprint_exceptional_meeting","smn_sprint_exceptional_meeting_history","smn_scrum_template_occurrence","smn_sprint_ceremony_status_history","smn_scrum_template_occurrence_status_history","smn_sprint_exceptional_meeting_status_history","smn_meeting_actual_duration_audit","smn_calendar_meeting_schedule_history","smn_exceptional_meeting_participant","smn_exceptional_meeting_participant_audit","smn_exceptional_capacity_impact_history","smn_scrum_cadence","smn_scrum_cadence_audit","smn_sprint_batch_preview","smn_sprint_batch_audit"])
  assert.ok(m.includes(name),name);
 assert.match(m,/schema_version!==32/);
 assert.match(m,/ROLLBACK/);
 assert.doesNotMatch(m,/\b(?:DROP|TRUNCATE|DELETE FROM)\b/i);
});

test("Cérémonies: résultats de réunion migrés après les registres",()=>{
 const migration=read("scripts/apply-meeting-outcome-schema-v32.ts");
 const service=read("src/server/sprints/calendar-meeting-outcomes.ts");
 assert.match(migration,/Migration Registres requise/);
 assert.match(migration,/CREATE TABLE IF NOT EXISTS public.smn_calendar_meeting_outcome_link/);
 assert.match(migration,/CREATE INDEX IF NOT EXISTS smn_calendar_meeting_outcome_by_event/);
 assert.match(migration,/ROLLBACK/);
 assert.doesNotMatch(service,/\\b(?:CREATE|ALTER|DROP)\\s+(?:TABLE|INDEX)\\b/i);
});

test("Cérémonies: résultats de réunion sans DDL indirect des registres",()=>{
 const service=read("src/server/sprints/calendar-meeting-outcomes.ts");
 assert.doesNotMatch(service,/ensureRegistrySchema/);
 assert.match(service,/smn_registry_item_audit/);
 assert.match(service,/meeting-outcome-schema-not-ready/);
});
