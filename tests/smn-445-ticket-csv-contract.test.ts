import {test} from "node:test";
import assert from "node:assert/strict";
import {
  TICKET_CSV_COLUMNS, TICKET_CSV_SCHEMA_VERSION, validateTicketCsv, isCompletedTicketStatus,
} from "../src/lib/ticket-csv-contract";

const header = TICKET_CSV_COLUMNS.join(",");
const row = "ABC-12,Bug,Correction du filtre,Important,Done,3";

test("accepts the six business columns without a fixed vocabulary", () => {
  const result = validateTicketCsv(`${header}\n${row}\nABC-13,Type inédit,Titre inédit,Priorité personnalisée,Statut maison,8`);
  assert.equal(result.valid, true);
  assert.equal(result.version, TICKET_CSV_SCHEMA_VERSION);
  assert.equal(result.rows.length, 2);
  assert.equal(result.rows[1].status, "Statut maison");
});

test("accepts a different column order and extra optional columns", () => {
  const csv = "status;resume;id;sp;priority;type;Note externe\nTerminé;Exemple;XYZ-9;2,5;Urgente;Story;ok";
  const result = validateTicketCsv(csv);
  assert.equal(result.valid, true, JSON.stringify(result.errors));
  assert.equal(result.delimiter, ";");
  assert.equal(result.rows[0].jiraId, "XYZ-9");
  assert.equal(result.rows[0].extra["Note externe"], "ok");
});

test("supports quotes, embedded separators, escaped quotes and line breaks", () => {
  const csv = `${header}\nABC-1,Bug,"Erreur, ""vue""\nsur deux lignes",P1,Done,2\n`;
  const result = validateTicketCsv(csv);
  assert.equal(result.valid, true, JSON.stringify(result.errors));
  assert.equal(result.rows[0].title, 'Erreur, "vue"\nsur deux lignes');
  assert.equal(result.rows[0].line, 2);
});

test("handles UTF-8 BOM, blank lines and CRLF", () => {
  const result = validateTicketCsv(`\uFEFF${header}\r\n\r\n${row}\r\n`);
  assert.equal(result.valid, true, JSON.stringify(result.errors));
  assert.equal(result.rows[0].line, 3);
});

test("rejects structurally invalid CSV and missing columns", () => {
  const result = validateTicketCsv("id,status\nABC-1,Done");
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.code === "missing-column"));
  assert.deepEqual(result.rows, []);
});

test("rejects malformed quoting, mismatched cells and empty CSV", () => {
  assert.equal(validateTicketCsv(`${header}\nABC-1,Bug,"unfinished`).valid, false);
  assert.ok(validateTicketCsv(`${header}\nABC-1,Bug`).errors.some(error => error.code === "column-count"));
  assert.ok(validateTicketCsv(header).errors.some(error => error.code === "empty"));
});

test("rejects duplicate and missing Jira IDs without imposing a Jira-key regex", () => {
  const dup = validateTicketCsv(`${header}\n${row}\nabc-12,Bug,Autre,P2,Terminé,1`);
  assert.ok(dup.errors.some(error => error.code === "duplicate-jira-id"));
  const missing = validateTicketCsv(`${header}\n,Bug,Titre,P1,Done,2`);
  assert.ok(missing.errors.some(error => error.code === "missing-jira-id"));
  assert.equal(validateTicketCsv(`${header}\nclé-libre,Bug,Titre,P1,Done,2`).valid, true);
});

test("does not invent story points values", () => {
  const result = validateTicketCsv(`${header}\nABC-1,Bug,Titre,P1,Done,inconnu`);
  assert.equal(result.valid, true);
  assert.equal(result.rows[0].storyPoints, "inconnu");
  assert.ok(result.warnings.some(warning => warning.code === "unreadable-story-points"));
});

test("Done and Terminé are completed regardless of casing or spacing", () => {
  for (const status of ["Done", " done ", "Terminé", "TERMINE", "terminé"]) {
    assert.equal(isCompletedTicketStatus(status), true);
  }
  for (const status of ["In Progress", "À faire", "Completed", ""]) {
    assert.equal(isCompletedTicketStatus(status), false);
  }
});

test("CSV validation never touches the indicator persistence layer", () => {
  const result = validateTicketCsv(`${header}\n${row}`);
  assert.equal(result.valid, true);
  assert.equal(result.rows[0].storyPoints, "3");
});

test("canonical CSV names are id, type, resume, priority, status, sp",()=>{
 assert.deepEqual([...TICKET_CSV_COLUMNS],["id","type","resume","priority","status","sp"]);
 const parsed=validateTicketCsv("id,type,resume,priority,status,sp\\nT-7,Task,Enoncé,P1,Done,5");
 assert.equal(parsed.valid,true,JSON.stringify(parsed.errors));
 assert.equal(parsed.rows[0].jiraId,"T-7");
 assert.equal(parsed.rows[0].title,"Enoncé");
 assert.equal(parsed.rows[0].storyPoints,"5");
});

test("rejects all historical column names instead of silently accepting them",()=>{
 const historical="Id jira,Type de ticket,Titre du ticket,Priorité,Statut,Story points";
 const parsed=validateTicketCsv(historical+"\\nABC-7,Bug,Ancien fichier,Haute,Terminé,2");
 assert.equal(parsed.valid,false);
 assert.equal(parsed.errors.filter(error=>error.code==="missing-column").length,6);
 assert.deepEqual(parsed.rows,[]);
});

test("the former id header cannot replace the required id field",()=>{
 const parsed=validateTicketCsv(
  "Id jira,type,resume,priority,status,sp\\nABC-8,Bug,Titre,Haute,Done,2");
 assert.equal(parsed.valid,false);
 assert.ok(parsed.errors.some(error=>error.code==="missing-column"&&error.column==="id"));
});
