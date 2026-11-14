import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const read=(path:string)=>readFileSync(path,"utf8");
const paths=[
 "src/app/app/admin/settings/general/page.tsx",
 "src/app/app/admin/settings/teams/page.tsx",
 "src/app/app/admin/settings/ceremonies/page.tsx",
 "src/app/app/admin/settings/registries/page.tsx",
 "src/app/app/admin/settings/working-days/page.tsx",
 "src/app/app/admin/settings/holidays-closures/page.tsx",
 "src/app/app/admin/settings/links/page.tsx",
 "src/app/app/admin/settings/maintenance/page.tsx",
 "src/app/app/admin/companies/page.tsx",
 "src/app/app/admin/scrum-cadence/page.tsx",
 "src/app/app/admin/kanban-cadence/page.tsx",
 "src/app/app/admin/absence-categories/page.tsx",
 "src/app/app/admin/users/page.tsx",
 "src/app/app/security/page.tsx"
];
test("all adapted settings destinations use a shared shell with no top-level breadcrumb",()=>{
 for(const path of paths){
  const source=read(path);
  assert.match(source,/<SettingsPageShell\b/,path);
  assert.doesNotMatch(source,/href="\/app\/admin\/settings"/,path);
 }
});
test("reference settings routes contain no top-level breadcrumb",()=>{
 for(const path of [
  "src/app/app/admin/settings/indicators/page.tsx",
  "src/app/app/admin/settings/reports/charts/page.tsx",
  "src/app/app/admin/settings/reports/charts/style-editor.tsx"
 ]){
  const source=read(path);
  assert.doesNotMatch(source,/href="\/app\/admin\/settings"/,path);
  assert.doesNotMatch(source,/<nav\b[^>]*breadcrumb/,path);
 }
});
test("company catalogue keeps all four business operations, with FR/EN keys",()=>{
 const source=read("src/app/app/admin/companies/companies-admin.tsx");
 for(const operation of ['method:selected?"PATCH":"POST"','action=company.archivedAt?"reactivate":"archive"','method:"POST"','setStatus','setSearch','changeView']){
  assert.ok(source.includes(operation),operation);
 }
 const fr=JSON.parse(read("src/i18n/fr.json")).companiesAdmin as Record<string,unknown>;
 const en=JSON.parse(read("src/i18n/en.json")).companiesAdmin as Record<string,unknown>;
 assert.deepEqual(Object.keys(fr).sort(),Object.keys(en).sort());
 assert.deepEqual(Object.keys(fr.colorNames as object).sort(),Object.keys(en.colorNames as object).sort());
 assert.equal(typeof fr.unsaved,"string");
});
test("links settings separate inventory and categories without changing transfer and reassignment",()=>{
 const page=read("src/app/app/admin/settings/links/page.tsx");
 const inventory=read("src/app/app/admin/settings/links/links-admin-inventory.tsx");
 const categories=read("src/app/app/admin/settings/links/category-admin.tsx");
 assert.match(page,/id:"inventory"/);
 assert.match(page,/id:"categories"/);
 assert.match(inventory,/LinkTransfer/);
 assert.match(categories,/reassign/);
});

test("ceremony template editor protects drafts and resets after successful save",()=>{
 const source=read("src/app/app/admin/sprints/template-form.tsx");
 assert.match(source,/useUnsavedChanges\(editorOpen&&\(dirty\|\|busy\)/);
 assert.match(source,/dirty&&!window\.confirm\(t\("draft\.discardWarning"\)\)/);
 assert.match(source,/setId\(""\);setForm\(empty\);setActive\(true\);setRevision\(1\)/);
 assert.match(source,/disabled=\{busy\|\|!dirty\|\|!form\.name\.trim\(\)\}/);
});
test("accounts catalogue appears before the creation form without changing authorization",()=>{
 const source=read("src/app/app/admin/users/users-admin.tsx");
 const existing='t("accounts.existing")';
 const create='"accounts.createTitle"';
 assert.notEqual(source.indexOf(existing),-1,"Existing-account heading must exist");
 assert.notEqual(source.indexOf(create),-1,"Create-account heading must exist");
 assert.ok(source.indexOf(existing)<source.indexOf(create),"Existing accounts must precede creation");
 assert.match(source,/disabled=\{busy\|\|self\}/);
 assert.match(source,/role:edit\.role,isActive:edit\.isActive/);
});

test("settings tabs preserve hash deep links, keyboard navigation and authorized fallback",()=>{
 const tabs=read("src/app/app/admin/settings/settings-tabs.tsx");
 assert.match(tabs,/window\.location\.hash\.slice\(1\)/);
 assert.match(tabs,/setActive\(ids\.includes\(hash\)\?hash:/);
 assert.match(tabs,/const selected=available\?active:/);
 assert.match(tabs,/window\.history\.replaceState\(window\.history\.state/);
 assert.match(tabs,/\["ArrowRight","ArrowLeft","Home","End"\]/);
 assert.match(tabs,/role="tabpanel"/);
 assert.match(tabs,/tabIndex=\{0\} hidden=\{selected!==section\.id\}/);
 const maintenance=read("src/app/app/admin/settings/maintenance/page.tsx");
 assert.match(maintenance,/\.\.\.\(backups\?/);
 assert.match(maintenance,/\.\.\.\(audit\?/);
 const calendar=read("src/app/app/admin/settings/holidays-closures/page.tsx");
 assert.match(calendar,/canAccess\(account,"write"/);
});

test("company API errors use localized messages rather than displaying server codes",()=>{
 const source=read("src/app/app/admin/companies/companies-admin.tsx");
 const fr=JSON.parse(read("src/i18n/fr.json")).companiesAdmin.errors as Record<string,string>;
 const en=JSON.parse(read("src/i18n/en.json")).companiesAdmin.errors as Record<string,string>;
 assert.deepEqual(Object.keys(fr).sort(),Object.keys(en).sort());
 for(const code of ["invalid-input","duplicate-name","not-found","conflict","already-archived","already-active","forbidden","service-unavailable"]){
  assert.ok(source.includes('"'+code+'"'),code);
 }
 assert.match(source,/companyError\(value\.error,t,"saveFailed"\)/);
 assert.match(source,/companyError\(result\.error,t,"changeFailed"\)/);
});

test("archived teams keep read-only details and remain reactivatable",()=>{
 const source=read("src/app/app/admin/settings/teams/teams-settings.tsx");
 const disabled="disabled={!canWrite||saving||loading||!!current?.isArchived}";
 // Les quatre champs texte (nom, produit, vision, objectif) sont protégés.
 assert.equal(source.split(disabled).length-1,4);
 assert.match(source,/disabled=\{!canWrite\|\|loading\|\|saving\|\|!!current\?\.isArchived\|\|!hasName/);
 assert.match(source,/settingsCollections\.reactivateTeam/);
 assert.match(source,/current\.isArchived\?"settingsCollections\.reactivateTeam"/);
});

test("settings detail panels span the available width with a themed white surface",()=>{
 const css=read("src/app/app/admin/settings/settings-page-shell.css");
 assert.match(css,/\.smn-settings-detail-content-narrow\{width:100%;max-width:none/);
 assert.match(css,/\.smn-settings-detail-content :is\(\.smn-panel,\.card\)/);
 assert.match(css,/background-color:var\(--bs-body-bg,#fff\)/);
 assert.match(css,/\[role="tabpanel"\] > :is\(\.smn-panel,\.card\)/);
 for(const path of [
  "src/app/app/admin/settings/general/page.tsx",
  "src/app/app/admin/scrum-cadence/page.tsx",
  "src/app/app/admin/kanban-cadence/page.tsx",
  "src/app/app/admin/settings/ceremonies/page.tsx",
  "src/app/app/admin/settings/working-days/page.tsx",
  "src/app/app/security/page.tsx"
 ]){
  const source=read(path);
  assert.match(source,/<SettingsPageShell\b/,path);
  assert.doesNotMatch(source,/\bconstrained(?=>)/,path);
 }
});

test("cadence timezone controls use IANA dropdown without free text",()=>{
 const dropdown=read("src/app/app/admin/settings/iana-time-zone-select.tsx");
 assert.match(dropdown,/Intl\.supportedValuesOf\("timeZone"\)/);
 assert.match(dropdown,/new Set\(\[\.\.\.values,"UTC",value\]/);
 assert.match(dropdown,/<select id=\{id\}/);
 for(const path of [
  "src/app/app/admin/scrum-cadence/cadence-form.tsx",
  "src/app/app/admin/kanban-cadence/kanban-cadence-form.tsx"
 ]){
  const source=read(path);
  assert.match(source,/IanaTimeZoneSelect/);
  assert.doesNotMatch(source,/<input id="(?:cadence|kanban)-zone"/);
  assert.match(source,/onChange=\{value=>change\("timeZone",value\)\}/);
 }
});
