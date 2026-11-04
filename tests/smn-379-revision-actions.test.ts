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
 assert.match(page,/btn btn-outline-secondary btn-sm" disabled/);
 assert.match(page,/migration d’audit/);
});


test("SMN-379 : date hors affectation : message explicite, sans contrôle de date courante",()=>{
 const editor=read("src/app/app/admin/members/assignment-editor.tsx");
 assert.match(editor,/if\(teamScoped&&state\.endOn\)\{/);
 assert.match(editor,/draft\.effectiveFrom>state\.endOn/);
 assert.match(editor,/Cette incohérence historique doit être corrigée/);
 assert.match(editor,/en dehors de la période/);
 assert.match(editor,/else if\(draft\.effectiveFrom<state\.today/);
});
