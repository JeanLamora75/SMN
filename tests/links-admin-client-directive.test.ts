import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

test("Links settings inventory declares use client before all imports",()=>{
 const content=readFileSync(new URL("../src/app/app/admin/settings/links/links-admin-inventory.tsx",import.meta.url),"utf8");
 assert.match(content,/^"use client";\s*import SettingsFilterPanel from "\.\.\/settings-filter-panel";/);
});

test("all interactive Settings components touched by filter harmonization retain a top-level client directive",()=>{
 const files=[
 "src/app/app/admin/settings/links/links-admin-inventory.tsx",
 "src/app/app/admin/settings/teams/teams-settings.tsx",
 "src/app/app/admin/absence-categories/absence-categories-admin.tsx",
 "src/app/app/admin/users/users-admin.tsx",
 "src/app/app/admin/companies/companies-admin.tsx",
 "src/app/app/admin/countries/country-admin.tsx",
 "src/app/app/admin/sprints/template-form.tsx",
 "src/app/app/admin/settings/indicators/expression-guide.tsx",
 "src/app/app/admin/settings/indicators/recommended-guide.tsx",
 "src/app/app/admin/indicators/catalog-client.tsx",
 "src/app/app/admin/settings/reports/charts/style-gallery.tsx",
 "src/app/app/admin/company-closures/company-closures-admin.tsx",
 "src/app/app/admin/settings/settings-catalog-view.tsx"
 ];
 for(const file of files){
  const content=readFileSync(new URL("../"+file,import.meta.url),"utf8");
  assert.match(content,/^"use client";/,file);
 }
});
