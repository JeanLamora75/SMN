import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const occurrences=read("src/server/sprints/template-occurrences.ts");
const route=read("src/app/api/admin/sprints/historical/route.ts");
const migration=read("prisma/migrations/20261028_smn316_company_catalog/migration.sql");

test("v32 : génération des cérémonies sans colonne team_id supprimée des fermetures",()=>{
 assert.match(migration,/ALTER TABLE public\.smn_company_closure DROP COLUMN team_id/);
 assert.doesNotMatch(occurrences,/FROM public\.smn_company_closure WHERE team_id=/);
 assert.match(occurrences,/to_jsonb\(c\)->>'company_id'/);
 assert.match(occurrences,/to_jsonb\(c\)->>'team_id'/);
});
test("v32 : une fermeture collective n'est retenue que pour les membres affectés concernés",()=>{
 assert.match(occurrences,/FROM public\.smn_member_assignment a/);
 assert.match(occurrences,/BOOL_AND\(closed\)/);
 assert.match(occurrences,/COUNT\(\*\)>0/);
});
test("v32 : échec de reprise historique journalisé côté serveur",()=>{
 assert.match(route,/historical-sprint-create-failed/);
 assert.match(route,/schema-not-ready/);
 assert.match(route,/503/);
});
