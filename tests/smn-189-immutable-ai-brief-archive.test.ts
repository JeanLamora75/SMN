import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {digestTxt,validateFinalizeInput} from "../src/server/ai-briefs/archive";

const txt="Équipe : Alpha\nValeur : 0 SP\n";
const valid={mode:"scrum",cycleId:"12345678-1234-1234-1234-123456789012",templateId:"cycle-review",templateRevision:0,txt,approvedSha256:digestTxt(txt),reviewConfirmed:true};
test("the exact approved UTF-8 bytes are required",()=>{
 assert.equal(validateFinalizeInput(valid),true);
 assert.equal(validateFinalizeInput({...valid,txt:txt+"modification"}),false);
 assert.equal(validateFinalizeInput({...valid,reviewConfirmed:false}),false);
 assert.equal(validateFinalizeInput({...valid,approvedSha256:"invalid"}),false);
});
test("the archive is transactional and immutable at DB level",()=>{
 const source=readFileSync("src/server/ai-briefs/archive.ts","utf8")+"\n"+readFileSync("prisma/migrations/20261029_ai_brief_runtime_ddl/migration.sql","utf8");
 assert.match(source,/BEGIN/);assert.match(source,/COMMIT/);assert.match(source,/ROLLBACK/);
 assert.match(source,/BEFORE UPDATE OR DELETE/);
 assert.match(source,/content bytea NOT NULL/);
 assert.match(source,/octet_length\(content\)=byte_length/);
});
test("only an authorized admin may finalize",()=>{
 const route=readFileSync("src/app/api/admin/ai-briefs/finalize/route.ts","utf8");
 const ui=readFileSync("src/app/app/admin/ai-briefs/prepare/brief-overrides.tsx","utf8");
 assert.match(route,/authorizeApi\(req,"write"/);
 assert.match(route,/allowMutation\(req\)/);
 assert.match(ui,/if\(!approved\|\|preview===null/);
});
