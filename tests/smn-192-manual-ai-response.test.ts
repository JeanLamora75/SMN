import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {validManualAiResponse} from "../src/server/ai-briefs/responses";

test("manual pasted response required, AI provider and model optional",()=>{
 assert.equal(validManualAiResponse({text:"Analyse collective"}),true);
 assert.equal(validManualAiResponse({text:"Analyse collective",provider:"",model:""}),true);
 assert.equal(validManualAiResponse({text:"  "}),false);
 assert.equal(validManualAiResponse({text:"ok",provider:123}),false);
});
test("manual responses link to exact immutable archive, without modifying TXT",()=>{
 const src=readFileSync("src/server/ai-briefs/responses.ts","utf8")+"\n"+readFileSync("prisma/migrations/20261029_ai_brief_runtime_ddl/migration.sql","utf8");
 assert.match(src,/archive_id uuid NOT NULL REFERENCES public.smn_ai_brief_archive/);
 assert.match(src,/readPrivateBriefArchive\(db,archiveId,teamId\)/);
 assert.match(src,/INSERT INTO public.smn_ai_brief_response/);
 assert.doesNotMatch(src,/UPDATE public\.smn_ai_brief_archive/);
});
test("API authorizes write and read separately, never calls an AI provider",()=>{
 const api=readFileSync("src/app/api/ai-briefs/archives/[id]/responses/route.ts","utf8");
 assert.match(api,/authorizeApi\(req,"write"/);
 assert.match(api,/authorizeApi\(req,"read"/);
 assert.doesNotMatch(api,/https?:\/\/|openai\.chat|responses\.create/);
});
