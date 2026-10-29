import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import type {Client} from "pg";
import {ensureCapacityRecalcOutbox} from "../src/server/capacity/company-recalc-outbox";

const sql=readFileSync(new URL("../prisma/migrations/20261029_company_capacity_outbox/migration.sql",import.meta.url),"utf8");
test("la migration est explicite, idempotente et sans suppression",()=>{
 assert.match(sql,/CREATE TABLE IF NOT EXISTS public\.smn_company_capacity_recalc/);
 assert.match(sql,/CREATE INDEX IF NOT EXISTS smn_company_capacity_recalc_due_idx/);
 assert.doesNotMatch(sql,/\b(DROP|TRUNCATE|DELETE FROM)\b/i);
});
test("la vérification métier ne produit jamais de DDL",async()=>{
 const commands:string[]=[];
 const db={query:async(text:string)=>{commands.push(text);return {rows:[{ready:true}]};}} as unknown as Client;
 await ensureCapacityRecalcOutbox(db);
 assert.equal(commands.length,1);
 assert.doesNotMatch(commands.join("\n"),/\b(CREATE|ALTER|DROP|TRUNCATE)\s+(TABLE|INDEX)/i);
});
test("absence du schéma : erreur explicite et aucune création opportuniste",async()=>{
 const commands:string[]=[];
 const db={query:async(text:string)=>{commands.push(text);return {rows:[{ready:false}]};}} as unknown as Client;
 await assert.rejects(ensureCapacityRecalcOutbox(db),/company-capacity-outbox-schema-missing/);
 assert.equal(commands.length,1);
});
test("application uniquement sur invocation explicite et transactionnelle",()=>{
 const runner=readFileSync(new URL("../scripts/apply-company-capacity-outbox.ts",import.meta.url),"utf8");
 assert.match(runner,/--apply/);
 assert.match(runner,/ROLLBACK/);
 assert.match(runner,/schema_version<31/);
});
