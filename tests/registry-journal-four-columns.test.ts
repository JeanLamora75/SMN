import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("Journal : date/heure séparées, type, contenu, icônes accessibles",()=>{
 const ui=read("src/app/app/admin/registries/registry-journal.tsx");
 for(const selector of ["smn-registry-journal-entry-date","smn-registry-journal-entry-type",
  "smn-registry-journal-entry-main","smn-registry-journal-actions"])
  assert.ok(ui.includes(selector),selector);
 assert.match(ui,/dateOnly\.format\(new Date\(entry\.at\)\)/);
 assert.match(ui,/timeOnly\.format\(new Date\(entry\.at\)\)/);
 assert.match(ui,/name="pencil-square"/);
 assert.match(ui,/name="trash"/);
 assert.match(ui,/aria-label=\{commentsText\("withdraw"\)\}/);
 assert.match(ui,/void withdraw\(entry\.comment\)/);
});

test("Journal : suppression limitée au retrait logique de commentaire, sans fausse API DELETE de fiche",()=>{
 const api=read("src/app/api/admin/registries/[id]/route.ts");
 const ui=read("src/app/app/admin/registries/registry-journal.tsx");
 assert.doesNotMatch(api,/export async function DELETE/);
 assert.match(ui,/entry\.kind==="comment"\?!entry\.comment\.withdrawn/);
 assert.match(ui,/RegistryEditModal/);
 assert.match(ui,/commentsText\("confirmWithdraw"\)/);
});

test("Journal : grille desktop quatre colonnes et repli mobile",()=>{
 const css=read("src/app/app/admin/registries/registry-cockpit.css");
 assert.match(css,/grid-template-columns:120px 140px minmax\(0,1fr\) 96px/);
 assert.match(css,/@media\(max-width:575px\)/);
 assert.match(css,/\.smn-registry-journal-linked-title>a/);
});
