import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const root=new URL("../",import.meta.url);
const source=(path:string)=>readFileSync(new URL(path,root),"utf8");

test("le portail Paramètres pointe vers Équipes dans les deux modes",()=>{
 const catalogue=source("src/lib/settings-catalog.ts");
 assert.match(catalogue,/id:"teams".*href:"\/app\/admin\/settings\/teams"/);
 assert.match(catalogue,/id:"agile"/);
});
test("le formulaire contient les quatre champs validés et seul le nom obligatoire",()=>{
 const page=source("src/app/app/admin/settings/teams/teams-settings.tsx");
 for(const field of ["name","product","vision","goal"])
  assert.match(page,new RegExp('id="smn-team-settings-'+field+'"'));
 assert.match(page,/required maxLength=\{120\}/);
 assert.match(page,/productName:values\.productName\.trim\(\)\|\|null/);
 assert.match(page,/dirty&&!window\.confirm/);
});
test("i18n FR/EN : aucune clé manquante dans le formulaire",()=>{
 const fr=JSON.parse(source("src/i18n/fr.json")) as Record<string,any>;
 const en=JSON.parse(source("src/i18n/en.json")) as Record<string,any>;
 assert.deepEqual(Object.keys(fr.teamSettings).sort(),Object.keys(en.teamSettings).sort());
 assert.ok(fr.settingsCatalog.items.teams?.title);
 assert.ok(en.settingsCatalog.items.teams?.title);
});
test("API : vérification Admin, désactivation par défaut et schéma 28",()=>{
 const api=source("src/app/api/admin/teams/route.ts");
 assert.match(api,/process\.env\.SMN_MULTI_TEAM_WRITES_ENABLED==="true"/);
 assert.match(api,/export async function GET/);
 assert.match(api,/export async function POST/);
 assert.match(api,/export async function PATCH/);
 assert.equal(api.split("if(!teamWritesEnabled())").length-1,2);
 assert.match(api,/schema_version===28/);
 assert.match(api,/authorizeApi\(request,"write",settings\)/);
 assert.match(api,/readJsonObject\(request,48000\)/);
});
