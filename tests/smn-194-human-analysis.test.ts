import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {validHumanAnalysis} from "../src/server/ai-briefs/human-analyses";
const base={mode:"scrum",cycleId:"12345678-1234-1234-1234-123456789012",scope:"Rétrospective",content:"Interprétation humaine"};
test("human analysis does not require a parent brief",()=>{
 assert.equal(validHumanAnalysis(base),true);
 assert.equal(validHumanAnalysis({...base,archiveId:null}),true);
 assert.equal(validHumanAnalysis({...base,content:" "}),false);
});
test("human analysis explicitly stores origin, author and timestamps",()=>{
 const source=readFileSync("src/server/ai-briefs/human-analyses.ts","utf8")+"\n"+readFileSync("prisma/migrations/20261029_ai_brief_runtime_ddl/migration.sql","utf8");
 assert.match(source,/CHECK\(origin='human'\)/);
 assert.match(source,/author_id text NOT NULL/);
 assert.match(source,/created_at timestamptz NOT NULL DEFAULT now\(\)/);
 assert.match(source,/updated_at=now\(\)/);
 assert.doesNotMatch(source,/UPDATE public\.smn_ai_brief_response/);
});
test("read-only accounts cannot create or modify human analyses",()=>{
 const route=readFileSync("src/app/api/ai-briefs/human-analyses/route.ts","utf8");
 assert.match(route,/authorizeApi\(req,"write"/);
 assert.match(route,/authorizeApi\(req,"read"/);
});
