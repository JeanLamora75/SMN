import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const read=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const ui=()=>read("src/app/app/admin/sprints/sprint-index-view.tsx");
const css=()=>read("src/app/app/admin/sprints/sprints-cockpit.css");

test("Cockpit Sprints: styles limites a la page de liste",()=>{
 assert.match(read("src/app/app/admin/sprints/page.tsx"),/import "\.\/sprints-cockpit\.css"/);
 assert.match(ui(),/className="smn-sprints-cockpit d-grid gap-3"/);
 assert.match(css(),/\.smn-sprints-cockpit \.smn-sprints-hero/);
 assert.doesNotMatch(css(),/\.smn-registry-cockpit/);
});

test("Cockpit Sprints: un seul filtre pilote pastilles et select mobile",()=>{
 const source=ui();
 assert.match(source,/aria-pressed=\{filter===tab\.status\}/);
 assert.match(source,/onClick=\{\(\)=>change\(\(\)=>setFilter\(tab\.status\)\)\}/);
 assert.match(source,/id="sprint-index-status"/);
 assert.match(source,/value=\{filter\}/);
 assert.match(source,/allStatuses\.map\(status=>/);
 assert.match(source,/extraStatuses\.map\(status=>/);
 assert.match(source,/status:filter,sort,page:String\(page\)/);
 for(const status of ["all","active","planned","finished","closed","suspended"]){
  assert.ok(source.includes('"'+status+'"'),status);
 }
});

test("Cockpit Sprints: conserve les liens, acces et messages metier",()=>{
 const source=ui();
 for(const fragment of [
  'useDeferredValue(search)',
  'canManage&&<div className="smn-sprints-hero-actions"',
  'href="/app/admin/sprints/historical"',
  'href={generateHref}',
  'sprintDetailPath(item.id)',
  'onClick={()=>setNotice(t("sprintsIndex.calendarPending"))}',
  'href="/app/admin/sprints/tools#sprint-operations"',
  'sprintsIndex.stateUnverified',
  'sprintsIndex.concurrentActive',
  'sprintsIndex.noMatches',
  'sprintsIndex.error',
  'sprintsIndex.page',
  'sprintsIndex.previous',
  'sprintsIndex.next',
  'sprintsIndex.transitionNote'
 ])assert.ok(source.includes(fragment),fragment);
 assert.doesNotMatch(source,/href="#"/);
});

test("Cockpit Sprints: affiche une seule liste, structure adaptable au mobile",()=>{
 const source=ui(),styles=css();
 assert.match(source,/<table className="table table-hover align-middle smn-sprints-table">/);
 assert.match(source,/data-label=\{t\("sprintsIndex\.period"\)\}/);
 assert.match(source,/data-label=\{t\("sprintStates\.status"\)\}/);
 assert.match(styles,/@media\(max-width:767\.98px\)/);
 assert.match(styles,/\.smn-sprints-table tbody tr\{/);
 assert.match(styles,/\.smn-sprints-state-mobile\{display:block\}/);
 assert.doesNotMatch(source,/smn-sprints-card-grid|view==="cards"/);
});

test("Cockpit Sprints: messages FR EN coherents",()=>{
 const fr=JSON.parse(read("src/i18n/fr.json")).sprintsIndex;
 const en=JSON.parse(read("src/i18n/en.json")).sprintsIndex;
 assert.deepEqual(Object.keys(fr).sort(),Object.keys(en).sort());
 for(const k of ["filtersHeading","historical","otherStatuses","teamLabel"])
  assert.ok(fr[k]&&en[k],k);
});
