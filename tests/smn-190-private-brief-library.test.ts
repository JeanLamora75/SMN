import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {createHash} from "node:crypto";
import {briefArchiveIdValid,verifiedBriefText} from "../src/server/ai-briefs/library";

test("integrity keeps UTF-8 TXT unchanged, including zero and accents",()=>{
 const text="Équipe Atlas\nTerminé : 0 SP\n";
 const bytes=Buffer.from(text,"utf8");
 const sha=createHash("sha256").update(bytes).digest("hex");
 assert.equal(verifiedBriefText(bytes,sha,bytes.length),text);
 assert.equal(verifiedBriefText(bytes,sha,bytes.length+1),null);
 assert.equal(verifiedBriefText(Buffer.from(text+"x"),sha,bytes.length),null);
});
test("unknown archive identifiers are rejected",()=>{
 assert.equal(briefArchiveIdValid("abc"),false);
 assert.equal(briefArchiveIdValid("12345678-1234-1234-1234-123456789012"),true);
});
test("download and pages verify scope on the server and never regenerate content",()=>{
 const api=readFileSync("src/app/api/ai-briefs/archives/[id]/download/route.ts","utf8");
 const viewer=readFileSync("src/app/app/ai-briefs/archives/[id]/page.tsx","utf8");
 const store=readFileSync("src/server/ai-briefs/library.ts","utf8");
 assert.match(api,/authorizeApi\(req,"read"/);
 assert.match(viewer,/canAccess\(account,"read"/);
 assert.match(store,/a.team_id=\$2/);
 assert.match(api,/integrity-error/);
 assert.doesNotMatch(api,/composeBriefTxt|readBriefFacts/);
});
