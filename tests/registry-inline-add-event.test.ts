import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("Bouton Ajouter un événement entre filtres et résultats",()=>{
 const s=source("src/app/app/admin/registries/registry-list.tsx");
 assert.ok(s.indexOf('className="smn-registry-add-event"')>s.indexOf('smn-registry-compact-filters'));
 assert.ok(s.indexOf('className="smn-registry-add-event"')<s.indexOf('className="smn-registry-results"'));
 assert.match(s,/onClick=\{\(\)=>setCreateOpen\(true\)\}/);
 assert.match(s,/restrictedTypes=\{visibleRegistryTypes\}/);
});
test("Modal limite les types sans limiter la création dans les journaux",()=>{
 const s=source("src/app/app/admin/registries/registry-create-modal.tsx");
 assert.match(s,/restrictedTypes\?\?\(linkedFromJournal\?linkedJournalTypes:registryTypes\)/);
 const fr=JSON.parse(source("src/i18n/fr.json"));
 const en=JSON.parse(source("src/i18n/en.json"));
 assert.ok(fr.registryList.addEvent&&en.registryList.addEvent);
});
