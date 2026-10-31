import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {formatRegistryDate} from "../src/lib/registry-date";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("les bornes sont projetées en dates civiles sans décalage de fuseau",()=>{
 const sql=read("src/server/registries/cycle-links.ts");
 assert.match(sql,/s\.start_at::date::text AS "startOn"/);
 assert.match(sql,/s\.end_at::date::text AS "endOn"/);
});
test("l'affichage suit la langue active avec mois abrégé",()=>{
 const component=read("src/app/app/admin/registries/registry-cycles.tsx");
 assert.match(component,/useLocale\(\)/);
 assert.match(component,/formatRegistryDate\(cycle\.startOn,locale\)/);
 assert.match(component,/formatRegistryDate\(cycle\.endOn,locale\)/);
 assert.match(formatRegistryDate("2026-10-24","fr"),/oct/i);
 assert.match(formatRegistryDate("2026-10-24","en"),/Oct/i);
});
