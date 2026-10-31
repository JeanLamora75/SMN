import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("Synthèse affiche le journal sous la description et dans la colonne gauche",()=>{
 const source=read("src/app/app/admin/registries/registry-summary.tsx");
 assert.ok(source.indexOf('registry-summary-description-title')<source.indexOf('smn-registry-summary-journal'));
 assert.ok(source.indexOf('smn-registry-summary-journal')<source.indexOf('smn-registry-summary-side'));
 assert.match(source,/<RegistryJournal itemId=\{item\.id\}[\s\S]*?embedded\/>/);
});
test("Journal intégré masque la barre de recherche, les filtres et le tri",()=>{
 const source=read("src/app/app/admin/registries/registry-journal.tsx");
 assert.match(source,/embedded=false/);
 assert.match(source,/\{!embedded&&<div className="smn-registry-journal-toolbar">/);
 assert.match(source,/<ol className="smn-registry-journal-list">/);
});
