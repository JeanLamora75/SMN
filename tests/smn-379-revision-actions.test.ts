import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("SMN-379 : crayon cible la révision exacte, même pour plusieurs versions à la même date",()=>{
 const page=read("src/app/app/admin/members/[id]/member-team-read-only.tsx");
 const editor=read("src/app/app/admin/members/assignment-editor.tsx");
 assert.match(page,/setTargetRevision\(v\.revision\);setEditor\("assignment"\)/);
 assert.match(page,/targetRevision=\{targetRevision\}/);
 assert.match(editor,/state\.versions\.find\(v=>v\.revision===requestedRevision\)/);
 assert.match(editor,/setSelectedRevision\(revision\);setDraft\(values\);setBaseline\(values\)/);
 assert.match(editor,/value=\{v\.revision\}/);
 assert.doesNotMatch(editor,/new Set\(state\.versions\.map\(v=>v\.effectiveFrom\)\)/);
});
test("SMN-379 : interdiction de l'annulation initiale et verrou explicite sans audit qualifié",()=>{
 const page=read("src/app/app/admin/members/[id]/member-team-read-only.tsx");
 assert.match(page,/v\.revision===Math\.max\(\.\.\.versions\.filter/);
 assert.match(page,/v\.revision>1/);
 assert.match(page,/btn btn-outline-danger btn-sm/);
 assert.match(page,/cancelVersion\(v\.assignmentId,v\.revision\)/);
 assert.match(page,/affectedClosedSprints/);
 const service=read("src/server/members/team-assignment-revision-cancel.ts");
 assert.match(service,/INSERT INTO public\.smn_member_lifecycle_event/);
 assert.match(service,/countAffectedClosedSprints/);
 assert.match(service,/if\(versions\.rows\.length<2\|\|versions\.rows\[0\]\.revision!==input\.revision\)/);
});


test("SMN-379 : contrôles de dates relatifs à l'affectation, non au jour courant",()=>{
 const editor=read("src/app/app/admin/members/assignment-editor.tsx");
 assert.match(editor,/if\(teamScoped\)\{/);
 assert.match(editor,/draft\.effectiveFrom>state\.endOn/);
 assert.match(editor,/else if\(draft\.effectiveFrom<state\.today/);
});

test("SMN-379 : le crayon corrige la version ciblée sans créer une cinquième ligne",()=>{
 const form=read("src/app/app/admin/members/assignment-editor.tsx");
 const service=read("src/server/members/team-assignment-historical-correction.ts");
 assert.match(form,/targetRevision:selectedRevision/);
 assert.match(service,/targetRevision/);
 assert.match(service,/UPDATE public\.smn_member_assignment_version SET/);
 assert.doesNotMatch(service,/INSERT INTO public\.smn_member_assignment_version/);
 assert.match(service,/kind:"assignment-version-correction"/);
});
