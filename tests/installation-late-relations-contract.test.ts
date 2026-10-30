import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {
 INITIAL_MIGRATION,INITIAL_REQUIRED_RELATIONS,INSTALLATION_RELATIONS
} from "../src/server/installation/contract";
import {INITIAL_SCHEMA_SQL} from "../src/server/installation/migration";
import {classifySnapshot} from "../src/server/installation/diagnostic";

const source=(file:string)=>readFileSync(new URL("../"+file,import.meta.url),"utf8");
const model={
 schemaUsage:true,schemaCreate:true,serverVersion:180006,
 tables:[...INITIAL_REQUIRED_RELATIONS],tableRead:true,migrationsRead:true,
 shapeValid:true,
 installations:[{id:"singleton",state:"initialized",schema_version:1}],
 migrations:[{
  migration_name:INITIAL_MIGRATION,
  checksum:createHash("sha256").update(INITIAL_SCHEMA_SQL).digest("hex"),
  finished_at:new Date(),rolled_back_at:null
 }]
};

test("les nouveaux objets SMN sont reconnus sans élargir le contrat aux objets étrangers",()=>{
 const approved=[
  "public.smn_report_document:r",
  "public.smn_report_document_session_write:r",
  "public.smn_registry_comment:r",
  "public.smn_registry_comment_revision:r",
  "public.smn_registry_linked_request:r",
  "public.smn_report_analysis_choice:r",
  "public.smn_sprint_historical_event:r",
  "public.smn_sprint_historical_capacity:r",
  "public.smn_kanban_period:r",
  "public.smn_ai_brief_archive:r",
  "public.smn_ai_brief_archive_immutable:function",
  "public.smn_historical_csv_batch:r"
 ];
 for(const relation of approved)
  assert.ok(INSTALLATION_RELATIONS.includes(relation as typeof INSTALLATION_RELATIONS[number]),relation);
 assert.equal(classifySnapshot({...model,tables:[...model.tables,...approved]}).status,"initialized");
 assert.equal(classifySnapshot({...model,tables:[...model.tables,...approved,
  "public.external_client_data:r"]}).status,"schema-incompatible");
 assert.equal(classifySnapshot({...model,tables:[...model.tables,
  "public.smn_imaginary_unapproved:r"]}).status,"schema-incompatible");
});

test("les relations métier sont déclarées dans leurs migrations SQL explicites",()=>{
 const verified=[
  ["src/server/reports/report-documents.ts","smn_report_document"],
  ["src/server/reports/report-documents.ts","smn_report_document_session_write"],
  ["src/server/reports/analysis-choices.ts","smn_report_analysis_choice"],
  ["src/server/registries/comments.ts","smn_registry_comment"],
  ["src/server/registries/comments.ts","smn_registry_comment_revision"],
  ["src/server/registries/items.ts","smn_registry_linked_request"],
  ["src/server/sprints/historical-events.ts","smn_sprint_historical_event"],
  ["src/server/kanban/periods.ts","smn_kanban_period"],
  ["src/server/ai-briefs/archive.ts","smn_ai_brief_archive"],
  ["src/server/historical-csv/confirm.ts","smn_historical_csv_batch"]
 ] as const;
 for(const [file,name] of verified){
  const ddlFile=file.startsWith("src/server/reports/")?"scripts/apply-report-schema-v32.ts":
   file.startsWith("src/server/registries/")?"scripts/apply-registry-core-v32.ts":
   file.startsWith("src/server/sprints/")?"scripts/apply-sprint-schema-v32.ts":
   file.startsWith("src/server/kanban/")?"scripts/apply-kanban-schema-v32.ts":
   file.startsWith("src/server/ai-briefs/")?"scripts/apply-ai-brief-schema-v32.ts":
   file.startsWith("src/server/historical-csv/")?"scripts/apply-historical-csv-schema-v32.ts":file;
  assert.match(source(ddlFile),new RegExp("CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?public\\."+name+"\\b","i"));
  assert.ok(INSTALLATION_RELATIONS.includes(("public."+name+":r") as typeof INSTALLATION_RELATIONS[number]),name);
 }
});

test("le diagnostic local reste en lecture seule et ne présente pas de secrets",()=>{
 const script=source("scripts/diagnose-schema-compatibility.ts");
 assert.match(script,/existingManagedUri\(\)/);
 assert.match(script,/probePostgres\(uri\)/);
 assert.match(script,/result\.tables\.filter\(name=>!authorized\.has\(name\)\)/);
 assert.doesNotMatch(script,/console\.(?:log|error)\([^\n]*(?:uri\b|password\b|encryptedPassword\b)/i);
 assert.doesNotMatch(script,/\b(?:DROP|TRUNCATE|DELETE\s+FROM|ALTER\s+TABLE)\b/);
});
