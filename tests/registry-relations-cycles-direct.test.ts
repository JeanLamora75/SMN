import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("Relations affiche seulement les trois familles de registres",()=>{
 const ui=read("src/app/app/admin/registries/registry-relations.tsx");
 assert.match(ui,/group\.type==="risk"\|\|group\.type==="obstacle"\|\|group\.type==="dependency"/);
});
test("Cycles dans l'onglet Relations : titre et commandes directes",()=>{
 const detail=read("src/app/app/admin/registries/registry-detail.tsx");
 const cycles=read("src/app/app/admin/registries/registry-cycles.tsx");
 assert.match(detail,/<RegistryCycles id=\{id\} teamId=\{teamId\} canManage=\{canManage\} embedded\/>/);
 assert.match(cycles,/<h2 className="h5 mb-0">\{tr\("heading"\)\}<\/h2>/);
 assert.match(cycles,/method:"PATCH"/);
 assert.match(cycles,/action:linked\?"unlinked":"linked"/);
});
