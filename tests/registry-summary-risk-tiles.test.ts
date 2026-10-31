import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("Synthèse risque: matrices réutilisées avant cycles associés",()=>{
 const s=read("src/app/app/admin/registries/registry-summary.tsx");
 assert.match(s,/item\.type==="risk"&&<div className="smn-registry-summary-risk-layout/);
 assert.match(s,/<RiskAssessment id=\{item\.id\} canManage=\{canManage\}/);
 assert.match(s,/<RiskRoam id=\{item\.id\} canManage=\{canManage\}/);
 assert.ok(s.indexOf('{tr("cycles")}')<s.indexOf('smn-registry-summary-risk-layout smn-registry-risk-layout'));
 assert.ok(s.indexOf('smn-registry-summary-risk-layout smn-registry-risk-layout')<s.indexOf('{tr("related")}'));
});
test("Disposition Synthèse : matrices empilées dans la colonne contextuelle",()=>{
 const css=read("src/app/app/admin/registries/registry-cockpit.css");
 assert.match(css,/\.smn-registry-summary-side \.smn-registry-summary-risk-layout\{[\s\S]*?flex-direction:column/);
 assert.match(css,/@media\(max-width:850px\)/);
});
