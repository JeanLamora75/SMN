import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const source=(p:string)=>readFileSync(p,"utf8");
test("member roster uses effective ISO2 location without extra member requests",()=>{
 const code=source("src/server/members/quick-create.ts");
 assert.match(code,/LEFT JOIN LATERAL \(\s*SELECT ml.country_iso2/);
 assert.match(code,/ml.effective_from<=CURRENT_DATE/);
 assert.match(code,/countryIso2:row.country_iso2\?\?null/);
});
test("team member cards and list display flag beside member name",()=>{
 const code=source("src/app/app/admin/members/team-overview.tsx");
 assert.match(code,/<CountryFlag countryIso2=\{member.countryIso2\}/);
 assert.match(code,/smn-team-member-name/);
 assert.match(code,/smn-team-list-name/);
});
test("flag names are normalized and missing assets do not show broken images",()=>{
 const code=source("src/app/app/admin/members/country-flag.tsx");
 assert.match(code,/\^\[A-Za-z\]\{2\}\$/);
 assert.match(code,/toLowerCase\(\)/);
 assert.match(code,/onError=\{\(\)=>setFailed\(true\)\}/);
 assert.match(code,/height:"1em"/);
});
