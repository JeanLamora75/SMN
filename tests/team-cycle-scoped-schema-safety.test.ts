import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const source=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("création Scrum contextualisée : absence de DDL implicite",()=>{
 const service=source("src/server/sprints/scoped-create.ts");
 const schema=source("src/server/teams/cycle-schema.ts");
 const occurrences=source("src/server/sprints/template-occurrences.ts");
 assert.match(service,/await requireScopedCycleSchema\(db,"scrum"\)/);
 assert.match(schema,/"smn_scrum_template_occurrence"/);
 assert.match(schema,/smn_scrum_template_occurrence:\["id"/);
 assert.match(service,/saveTemplateOccurrences\(db,/);
 assert.match(service,/schemaPrevalidated:true/);
 assert.doesNotMatch(service,/saveGeneratedCeremonies/);
 assert.match(occurrences,/if\(!options\.schemaPrevalidated\)await ensureTemplateOccurrenceSchema\(db\)/);
});
