import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import type {Client} from "pg";
import {readVerifiedPdfArchive} from "../src/server/reports/pdf-archive-store";

const uuid="bf6a3a8c-cb77-4cff-9146-8b807b2edb50";
test("SMN-39: revoked PDF is not exposed and immutable original is untouched",async()=>{
 const statements:string[]=[];
 const fake={query:async(sql:string,params:unknown[]=[]):Promise<unknown>=>{
  statements.push(sql);
  if(sql.includes("to_regclass('public.smn_report_pdf_archive')"))
   return {rows:[{present:true}]};
  if(sql.includes("to_regclass('public.smn_privacy_archive_restriction')"))
   return {rows:[{present:true}]};
  if(sql.includes("FROM public.smn_privacy_archive_restriction")){
   assert.deepEqual(params,[uuid]);
   return {rows:[{archive_id:uuid}]};
  }
  throw Error("Archive metadata/bytes must not be accessed after revocation");
 }} as unknown as Client;
 assert.equal(await readVerifiedPdfArchive(fake,uuid),null);
 assert.equal(statements.length,3);
});
test("SMN-39: PDF privacy restriction migration is additive and immutable",()=>{
 const sql=readFileSync("prisma/migrations/20261109_smn39_archive_restriction/migration.sql","utf8");
 assert.match(sql,/CREATE TABLE IF NOT EXISTS public\.smn_privacy_archive_restriction/);
 assert.match(sql,/REFERENCES public\.smn_privacy_erasure_receipt\(id\)/);
 assert.match(sql,/DEFERRABLE INITIALLY DEFERRED/);
 assert.match(sql,/BEFORE UPDATE OR DELETE/);
 assert.match(sql,/RESTRICT/);
 assert.doesNotMatch(sql,/ALTER TABLE public\.smn_report_pdf_archive/);
});
