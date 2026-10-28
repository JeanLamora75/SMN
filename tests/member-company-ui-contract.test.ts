import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
const view=readFileSync(new URL("../src/app/app/admin/members/team-overview.tsx",import.meta.url),"utf8");
const presentation=readFileSync(new URL("../src/server/members/company-presentation.ts",import.meta.url),"utf8");
test("le formulaire membre offre une entreprise facultative uniquement si catalogue accessible",()=>{
 assert.match(view,/companyEnabled&&/);
 assert.match(view,/companyId:newCompanyId\|\|null/);
 assert.match(view,/Aucune entreprise/);
});
test("les cartes et listes affichent la société déjà filtrée par équipe",()=>{
 assert.match(view,/<strong>\{member\.displayName\}<\/strong>\{member\.companyName/);
 assert.match(view,/member\.companyName&&<span className="ms-2/);
 assert.match(presentation,/m\.id=ANY\(\$1::text\[\]\)/);
});
