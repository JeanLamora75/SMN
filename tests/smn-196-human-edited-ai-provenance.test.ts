import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
test("AI response revision persists human-retouched flag and timestamps",()=>{
 const src=readFileSync("src/server/ai-briefs/responses.ts","utf8")+"\n"+readFileSync("prisma/migrations/20261029_ai_brief_runtime_ddl/migration.sql","utf8");
 assert.match(src,/human_edited boolean NOT NULL DEFAULT false/);
 assert.match(src,/human_edited=true/);
 assert.match(src,/r.created_at::text,r.updated_at::text,r.author_id,r.human_edited/);
});
test("both archive and journal distinguish raw AI and human retouches",()=>{
 const view=readFileSync("src/app/app/ai-briefs/archives/[id]/page.tsx","utf8");
 const journal=readFileSync("src/server/ai-briefs/journal.ts","utf8");
 assert.match(view,/Origine IA, retouchée par un humain/);
 assert.match(view,/dernière modification \{response.updated_at\}/);
 assert.match(journal,/Origine IA, retouchée par un humain/);
 assert.match(journal,/r.human_edited/);
});
test("human-origin analysis remains separate from AI provenance",()=>{
 const src=readFileSync("src/server/ai-briefs/human-analyses.ts","utf8")+"\n"+readFileSync("prisma/migrations/20261029_ai_brief_runtime_ddl/migration.sql","utf8");
 assert.match(src,/CHECK\(origin='human'\)/);
 assert.match(src,/updated_at=now\(\)/);
});
