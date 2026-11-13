import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import fr from "../src/i18n/fr.json";
import en from "../src/i18n/en.json";

const read=(name:string)=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
const panel=read("src/app/app/admin/settings/settings-filter-panel.tsx");
const styles=read("src/app/app/admin/settings/settings-filter-panel.css");
const cases=[
 ["settings portal","src/app/app/admin/settings/settings-catalog-view.tsx",["smn-settings-search","settingsCatalog.view.switchLabel"]],
 ["teams","src/app/app/admin/settings/teams/teams-settings.tsx",["searchTeams","filterStatus"]],
 ["users","src/app/app/admin/users/users-admin.tsx",["searchUsers","filterStatus","filterRole"]],
 ["companies","src/app/app/admin/companies/companies-admin.tsx",["companiesAdmin.search","companiesAdmin.filter"]],
 ["absence categories","src/app/app/admin/absence-categories/absence-categories-admin.tsx",["searchAbsences","filterStatus"]],
 ["countries","src/app/app/admin/countries/country-admin.tsx",["country-search","country-filter","country-year","country-archive-filter"]],
 ["ceremony templates","src/app/app/admin/sprints/template-form.tsx",["template-search","template-status"]],
 ["indicator catalog","src/app/app/admin/indicators/catalog-client.tsx",["indicator-catalog-search","indicator-catalog-status"]],
 ["expression guide","src/app/app/admin/settings/indicators/expression-guide.tsx",["expression-search","expression-category"]],
 ["recommended indicators","src/app/app/admin/settings/indicators/recommended-guide.tsx",["recommended-team","recommended-search","recommended-domain","recommended-type"]],
 ["links inventory","src/app/app/admin/settings/links/links-admin-inventory.tsx",["smn-links-admin-filters"]],
 ["Office chart styles","src/app/app/admin/settings/reports/charts/style-gallery.tsx",["style-search","style-origin","style-default-filter"]],
 ["company closures","src/app/app/admin/company-closures/company-closures-admin.tsx",["closure-company"]],
] as const;
test("one shared theme-aware filter component is available with an accessible bilingual heading",()=>{
 assert.match(panel,/aria-label=\{title\?\?t\("settingsCollections\.filtersTitle"\)\}/);
 assert.match(panel,/bi-sliders2/);
 assert.match(panel,/smn-settings-filter-fields/);
 assert.match(styles,/--smn-border/);
 assert.match(styles,/--smn-surface/);
 assert.match(styles,/--smn-brand/);
 assert.match(styles,/@media\(max-width:650px\)/);
 assert.equal(fr.settingsCollections.filtersTitle,"Filtres et recherche");
 assert.equal(en.settingsCollections.filtersTitle,"Filters and search");
});
for(const [name,path,fields] of cases){
 test(name+" filters are in their own shared panel",()=>{
  const source=read(path);
  assert.match(source,/<SettingsFilterPanel(?:\s|>)/);
  assert.match(source,/<\/SettingsFilterPanel>/);
  for(const field of fields)assert.ok(source.includes(field),name+": "+field);
  assert.equal((source.match(/<SettingsFilterPanel(?:\s|>)/g)??[]).length,1);
  assert.equal((source.match(/<\/SettingsFilterPanel>/g)??[]).length,1);
 });
}
test("primary tables and modals are still present after filter extraction",()=>{
 for(const [name,file,token] of [
  ["teams","src/app/app/admin/settings/teams/teams-settings.tsx","smn-teams-settings-modal"],
  ["users","src/app/app/admin/users/users-admin.tsx","smn-account-editor-dialog"],
  ["companies","src/app/app/admin/companies/companies-admin.tsx","smn-company-cockpit-dialog"],
  ["absences","src/app/app/admin/absence-categories/absence-categories-admin.tsx","smn-absence-category-dialog"],
  ["countries","src/app/app/admin/countries/country-admin.tsx","CountryFormModal"],
  ["ceremonies","src/app/app/admin/sprints/template-form.tsx","smn-ceremony-template-dialog"],
  ["indicators","src/app/app/admin/indicators/catalog-client.tsx","smn-indicator-global-list"],
  ["styles","src/app/app/admin/settings/reports/charts/style-gallery.tsx","smn-chart-card-grid"]
 ]){
  assert.ok(read(file).includes(token),name);
 }
});
