import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

test("member profile header displays its current country flag before the name",()=>{
 const source=readFileSync("src/app/app/admin/members/[id]/member-detail.tsx","utf8");
 assert.match(source,/import CountryFlag from "\.\.\/country-flag"/);
 assert.match(source,/<h1 className="h3 mb-0 d-inline-flex align-items-center gap-2"><CountryFlag/);
 assert.match(source,/countryIso2=\{location\?\.current\?\.countryIso2\}/);
 assert.match(source,/\/>\{member.displayName\}<\/h1>/);
});
