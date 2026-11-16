import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import fr from "../src/i18n/ai-connections.fr.json";
import en from "../src/i18n/ai-connections.en.json";
const read=(p:string)=>readFileSync(p,"utf8");
test("SMN-483 navigation is admin-only and translatable",()=>{
 const source=read("src/lib/settings-catalog.ts");
 const page=read("src/app/app/admin/settings/ai/page.tsx");
 assert.match(source,/id:"aiConnections"/);
 assert.match(source,/adminOnly:true/);
 assert.match(page,/actor\.role!=="admin"/);
 assert.deepEqual(Object.keys(fr.aiConnections).sort(),Object.keys(en.aiConnections).sort());
});
test("SMN-483 no key is read back, model list is fail closed",()=>{
 const view=read("src/app/app/admin/settings/ai/ai-connections-settings.tsx");
 const route=read("src/app/api/admin/ai-connections/local-check/route.ts");
 assert.match(view,/freeCatalog\.qualified/);
 assert.match(view,/password/);
 assert.match(view,/SettingsFilterPanel/);
 assert.match(view,/LinkDialog/);
 assert.doesNotMatch(view,/localStorage|sessionStorage|window\.prompt/);
 assert.match(route,/loadAiCredential/);
 assert.match(route,/secret\.fill\(0\)/);
 assert.match(route,/apiTested:false/);
 assert.doesNotMatch(route,/fetch\(/);
});
