import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("Score critique chargé à partir de l'évaluation enregistrée",()=>{
 const server=read("src/server/registries/list.ts");
 assert.match(server,/smn_risk_assessment/);
 assert.match(server,/probability\*a\.impact/);
 assert.match(server,/AS "criticalityScore"/);
});
test("Colonne Risque entre statut et catégorie; badge score et pas de signal highRisk",()=>{
 const list=read("src/app/app/admin/registries/registry-list.tsx");
 const row=read("src/app/app/admin/registries/registry-list-row.tsx");
 assert.ok(list.indexOf('translate("status")}</th>')<list.indexOf('translate("riskLevel")}</th>'));
 assert.ok(list.indexOf('translate("riskLevel")}</th>')<list.indexOf('translate("category")}</th>'));
 assert.match(row,/smn-registry-risk-score/);
 assert.match(row,/signal\.reason!=="highRisk"/);
 assert.match(list,/colSpan=\{canManage\?12:11\}/);
});
test("Palette neuf couleurs distinctes",()=>{
 const css=read("src/app/app/admin/registries/registry-cockpit.css");
 for(let i=1;i<=9;i++)assert.ok(css.includes(".smn-registry-risk-score-"+i+"{"));
});
