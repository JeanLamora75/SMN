import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const page=read("src/app/app/admin/settings/reports/charts/page.tsx");
const styles=read("src/app/app/admin/settings/reports/charts/style-gallery.css");
const shell=read("src/app/app/admin/settings/settings-page-shell.css");
test("Office chart style gallery uses same theme-aware header as other Settings pages",()=>{
 assert.match(page,/import SettingsPageShell from "\.\.\/\.\.\/settings-page-shell"/);
 assert.match(page,/<SettingsPageShell/);
 assert.match(page,/title=\{t\("chartStyles\.gallery\.heading"\)\}/);
 assert.match(page,/description=\{t\("chartStyles\.gallery\.intro"\)\}/);
 assert.doesNotMatch(page,/smn-chart-style-hero/);
 assert.match(shell,/linear-gradient\(115deg,var\(--smn-brand/);
 assert.doesNotMatch(styles,/\.smn-chart-style-hero\{/);
 assert.match(styles,/--smn-chart-primary:var\(--smn-brand\)/);
 assert.match(styles,/--smn-chart-border:var\(--smn-border\)/);
});
test("gallery functionality and scoped card/filter styles remain",()=>{
 for(const token of ["ChartStyleGallery isAdmin","smn-chart-style-page"]){
  assert.ok(page.includes(token),token);
 }
 for(const selector of [".smn-chart-gallery-controls",".smn-chart-card-grid",".smn-chart-default-grid",".smn-chart-m2-columns"]){
  assert.ok(styles.includes(selector),selector);
 }
});
