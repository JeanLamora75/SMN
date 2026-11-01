import {test} from "node:test";
import {strict as assert} from "node:assert";
import {readFileSync} from "node:fs";

// Tests documentaires statiques : ne connectent aucune base PostgreSQL.
const sql=readFileSync(new URL("../_bmad-output/planning-artifacts/SMN-338-DDL-ADDITIF-DRAFT.sql",import.meta.url),"utf8");

test("SMN-338 : DDL ajout seul, aucune opération destructive",()=>{
 assert.doesNotMatch(sql,/\b(?:DROP|TRUNCATE)\s+(?:TABLE|SCHEMA|DATABASE)\b/i);
 assert.doesNotMatch(sql,/\bALTER\s+TABLE\s+public\.smn_(?!indicator_)/i);
 assert.doesNotMatch(sql,/\bUPDATE\s+public\.smn_installation\b/i);
 assert.doesNotMatch(sql,/\b(?:BEGIN|COMMIT)\s*;/i);
});

test("SMN-338 : huit tables d'indicateurs explicites",()=>{
 const expected=["definition","team_selection","display_preference","manual_value","computed_result","dependency","cycle_revision","system_revision"];
 for(const name of expected)assert.match(sql,new RegExp("CREATE TABLE public\\.smn_indicator_"+name+"\\s*\\(","i"));
 const actual=[...sql.matchAll(/CREATE TABLE public\.(smn_indicator_\w+)/gi)].map(m=>m[1]);
 assert.equal(actual.length,expected.length);
 assert.equal(new Set(actual).size,expected.length);
});

test("SMN-338 : contraintes de valeur, dépendances et cycle",()=>{
 assert.match(sql,/cycle_type\s+text\s+NOT NULL CHECK\s*\(cycle_type IN \('scrum','kanban'\)\)/i);
 assert.match(sql,/value numeric\b/i);
 assert.match(sql,/source_type\s+text\s+NOT NULL CHECK/i);
 assert.match(sql,/smn_ind_dep_indicator_unique/i);
 assert.match(sql,/smn_ind_dep_calendar_unique/i);
 assert.match(sql,/source_indicator_id IS NULL OR source_indicator_id <> indicator_id/i);
 assert.match(sql,/FOREIGN KEY\s*\(team_id,indicator_id\)/i);
});

test("SMN-338 : état disponible exige valeur, état indisponible motif",()=>{
 assert.match(sql,/result_state='available' AND value IS NOT NULL/i);
 assert.match(sql,/result_state='unavailable' AND value IS NULL AND unavailable_reason IS NOT NULL/i);
 assert.match(sql,/unavailable_reason IS NOT NULL AND unavailable_reason='dependency_unavailable' OR unavailable_source_tag IS NULL/i);
});

test("SMN-338 : migration non activée et non validée PostgreSQL",()=>{
 assert.match(sql,/NON ACTIVÉ/i);
});

test("SMN-338 : aucune clé de dépendance composite nullable",()=>{
 const dependency=sql.split("CREATE TABLE public.smn_indicator_dependency (")[1]?.split(");")[0];
 assert.ok(dependency);
 assert.match(dependency,/id text PRIMARY KEY/i);
 assert.doesNotMatch(dependency,/PRIMARY KEY\\s*\\(indicator_id,source_type,source_indicator_id,source_calendar_tag\\)/i);
});


test("SMN-338 : fonctions PL/pgSQL délimitées et déclencheurs d'intégrité présents",()=>{
 const starts=[...sql.matchAll(/RETURNS trigger LANGUAGE plpgsql AS \$\$/g)];
 const endings=[...sql.matchAll(/\$\$;/g)];
 assert.equal(starts.length,2);
 assert.equal(endings.length,2);
 assert.match(sql,/CREATE TRIGGER smn_indicator_manual_value_integrity/);
 assert.match(sql,/CREATE TRIGGER smn_indicator_computed_result_integrity/);
 assert.match(sql,/CREATE TRIGGER smn_indicator_cycle_revision_integrity/);
});
