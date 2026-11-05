import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const editor=readFileSync(new URL("../src/app/app/admin/members/assignment-editor.tsx",import.meta.url),"utf8");
const service=readFileSync(new URL("../src/server/members/team-assignment-historical-correction.ts",import.meta.url),"utf8");

test("Correction: la date de la version historique est conservée, même si elle précède aujourd'hui",()=>{
 assert.match(editor,/effectiveFrom:baseline\?\.effectiveFrom\?\?state\.startOn\?\?state\.today/);
 assert.doesNotMatch(editor,/baseline&&baseline\.effectiveFrom>state\.today\?baseline\.effectiveFrom:state\.today/);
 assert.match(editor,/state\.versions\.find\(v=>v\.revision===requestedRevision\)/);
 assert.match(editor,/setSelectedRevision\(revision\);setDraft\(values\);setBaseline\(values\)/);
});
test("Nouveau changement: la date reste gérée séparément; correction: ciblage revision + date exacte",()=>{
 assert.match(editor,/if\(targetRevision===null\)\{/);
 assert.match(editor,/start\.effectiveFrom=chosenDate/);
 assert.match(editor,/const values=draftFrom\(state,selectedRevision\)/);
 assert.match(editor,/targetRevision:selectedRevision/);
 assert.match(service,/selected\.effective_from!==input\.effectiveFrom/);
 assert.match(service,/UPDATE public\.smn_member_assignment_version SET/);
 assert.doesNotMatch(service,/INSERT INTO public\.smn_member_assignment_version/);
});
