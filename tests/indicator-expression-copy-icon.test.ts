import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const source=read("src/app/app/admin/settings/indicators/expression-guide.tsx");
const css=read("src/app/app/admin/settings/indicators/indicator-settings-cockpit.css");
test("expression guide uses accessible clipboard icons in list and card views",()=>{
 assert.equal((source.match(/className="bi bi-clipboard"/g)??[]).length,2);
 assert.equal((source.match(/aria-label=\{t\("indicatorSettingsUi\.copy"\)\+": "\+entry\.name\}/g)??[]).length,2);
 assert.equal((source.match(/title=\{t\("indicatorSettingsUi\.copy"\)\}/g)??[]).length,2);
 assert.equal((source.match(/smn-indicator-copy-icon/g)??[]).length,2);
 assert.equal((source.match(/navigator\.clipboard\.writeText\(entry\.example\)/g)??[]).length,2);
 assert.match(css,/\.smn-indicator-guide-panel \.smn-indicator-copy-icon\{/);
 assert.match(css,/width:36px;height:36px/);
});
