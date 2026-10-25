import test from "node:test";
import assert from "node:assert/strict";
import {studioArchiveReference} from "../src/server/reports/studio-archive-reference";
import type {ReportDocument} from "../src/server/reports/report-documents";
const doc={id:"11111111-1111-4111-8111-111111111111",sprintId:"22222222-2222-4222-8222-222222222222",teamId:"33333333-3333-4333-8333-333333333333",title:"Bilan",language:"fr",status:"draft",templateId:"standard",templateVersion:1,revision:3,updatedAt:"2026-10-25T12:00:00Z",content:{userNotes:{executive:"Stable"},metrics:{a:1}}} as ReportDocument;
test("source digest is deterministic even when JSON key insertion order changes",()=>{
 const a=studioArchiveReference(doc);
 const b=studioArchiveReference({...doc,content:{metrics:{a:1},userNotes:{executive:"Stable"}}});
 assert.deepEqual(a,b);
 assert.match(a.sourceSha256,/^[a-f0-9]{64}$/);
});
test("new editorial revision or content has a different frozen source identity",()=>{
 const before=studioArchiveReference(doc);
 assert.notEqual(studioArchiveReference({...doc,revision:4}).sourceSha256,before.sourceSha256);
 assert.notEqual(studioArchiveReference({...doc,content:{userNotes:{executive:"Updated"}}}).sourceSha256,before.sourceSha256);
});
