import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(file:string)=>readFileSync(new URL("../"+file,import.meta.url),"utf8");
test("v33 reporting displays selected indicators without saved screen preference",()=>{
 const sql=read("src/server/indicators/reporting.ts");
 assert.match(sql,/LEFT JOIN public\.smn_indicator_display_preference p/);
 assert.match(sql,/p\.screen_key=\$2/);
 assert.match(sql,/COALESCE\(p\.is_visible,true\)=true/);
 assert.match(sql,/COALESCE\(p\.display_style,'number'\)/);
 assert.match(sql,/s\.is_active=true/);
 assert.match(sql,/d\.archived_at IS NULL/);
});
test("v33 explicit hidden preferences remain authoritative",()=>{
 const sql=read("src/server/indicators/reporting.ts");
 assert.doesNotMatch(sql,/JOIN public\.smn_indicator_display_preference p[^\n]*\n WHERE d\.archived_at IS NULL AND p\.screen_key/);
 const ui=read("src/app/app/admin/indicators/catalog-client.tsx");
 assert.match(ui,/checked=\{p\?\.is_visible\?\?true\}/);
});
