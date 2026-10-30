import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const service=read("src/server/sprints/reschedule.ts");
const editor=read("src/app/app/admin/sprints/[sprintId]/sprint-detail-editor.tsx");

test("v32 : la prévisualisation et la confirmation recherchent le Sprint dans une équipe Scrum active",()=>{
 assert.match(service,/i\.schema_version BETWEEN 28 AND 32/);
 assert.match(service,/to_jsonb\(t\)->>'agile_mode'/);
 assert.match(service,/to_jsonb\(t\)->>'is_archived'/);
 assert.match(service,/const s=await scope\(db,input\.sprintId\)/);
 assert.match(service,/const original=await scope\(db,input\.sprintId,true\)/);
 assert.doesNotMatch(service,/lower\(i\.mode\)='scrum'/);
});
test("v32 : les impacts de capacité restent isolés à l'équipe du Sprint",()=>{
 assert.match(service,/readDevelopmentCapacity\(db,newStart,newEnd,\{externalTransaction:true,includeExceptionalImpact:true,teamId:s\.team_id\}\)/);
 assert.match(service,/error:"sprint-overlap"/);
 assert.match(service,/error:"events-outside-new-period"/);
 assert.match(service,/pg_advisory_xact_lock/);
});
test("v32 : la modale explicite les refus fonctionnels et l'indisponibilité serveur",()=>{
 for(const code of ["not-found","closed-period","sprint-overlap","events-outside-new-period","unavailable"])
  assert.ok(editor.includes('data.error==="'+code+'"'),code);
});
