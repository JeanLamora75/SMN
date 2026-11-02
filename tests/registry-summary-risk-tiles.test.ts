import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Synthèse risque : Cycles, deux cartes, Fiches liées, Activité dans cet ordre",()=>{
 const s=read("src/app/app/admin/registries/registry-summary.tsx");
 const indices=['{tr("cycles")}','smn-registry-summary-risk-layout smn-registry-risk-layout',
  '{tr("related")}','{tr("recentActivity")}'].map(term=>s.indexOf(term));
 assert.ok(indices.every(index=>index>=0));
 assert.ok(indices.every((index,i)=>i===0||index>indices[i-1]));
 assert.match(s,/<RiskAssessment id=\{item\.id\} canManage=\{canManage\} compactTitle="Risque"\/>/);
 assert.match(s,/<RiskRoam id=\{item\.id\} canManage=\{canManage\} compactTitle="ROAM"\/>/);
});

test("Cartes compactes côte à côte dans la colonne droite, repli si étroit",()=>{
 const css=read("src/app/app/admin/registries/registry-cockpit.css");
 const marker=css.lastIndexOf(".smn-registry-summary-side .smn-registry-summary-risk-layout{");
 assert.ok(marker>0);
 assert.match(css.slice(marker,marker+180),/grid-template-columns:minmax\(0,1fr\)/);
 assert.match(css.slice(marker),/@media\(max-width:1100px\)/);
});
