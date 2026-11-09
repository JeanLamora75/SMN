import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {randomUUID,createHash} from "node:crypto";
import {mkdtemp,writeFile,rm} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import type {Client} from "pg";
import {inspectMemberRelations,inspectTextCandidates,inspectArchiveCandidates}
 from "../src/server/backup/erasure-impact-graph";
import {inspectPrivateDocuments} from "../src/server/backup/erasure-private-documents";

describe("SMN-38 — parcours des relations et archives du schéma v33",()=>{
 const fake={query:async(sql:string,params:unknown[]=[])=>{
  assert.ok(!/\b(DELETE|UPDATE|INSERT|DROP|TRUNCATE|ALTER)\b/i.test(sql));
  if(sql.includes("information_schema.columns"))
   return {rows:[{present:true}],rowCount:1};
  assert.ok(params[0]==="member-1");
  if(sql.includes("smn_member_assignment_version v"))
   return {rows:[{n:"4"}],rowCount:1};
  if(sql.includes("smn_member_absence_history h"))
   return {rows:[{n:"3"}],rowCount:1};
  if(sql.includes("smn_report_pdf_archive"))
   return {rows:[{n:"2"}],rowCount:1};
  if(sql.includes("unnest($2::text[])")){
   assert.deepEqual(params[1],["alice","alice@example.org"]);
   return {rows:[{n:"1"}],rowCount:1};
  }
  return {rows:[{n:"0"}],rowCount:1};
 }} as unknown as Client;
 it("suit assignment_id et absence_id au lieu d'ignorer ces historiques",async()=>{
  const rows=await inspectMemberRelations(fake,"member-1");
  assert.equal(rows.find(x=>x.table==="smn_member_assignment_version")?.count,4);
  assert.equal(rows.find(x=>x.table==="smn_member_absence_history")?.count,3);
  assert.equal(rows.find(x=>x.table==="smn_member_absence_history")?.scope,"indirect");
 });
 it("compte les archives d'équipe comme candidates, jamais comme preuve nominative",async()=>{
  const rows=await inspectArchiveCandidates(fake,"member-1");
  assert.equal(rows.find(x=>x.table==="smn_report_pdf_archive")?.count,2);
  assert.equal(rows.find(x=>x.table==="smn_report_pdf_archive")?.scope,"team-archive");
  assert.ok(rows.some(x=>x.table==="smn_report_studio_archive_snapshot"));
 });
 it("recherche les correspondances littérales sans divulguer les textes",async()=>{
  const rows=await inspectTextCandidates(fake,"member-1",["Alice","alice@example.org"]);
  assert.equal(rows.find(x=>x.table==="smn_report_pdf_archive")?.count,1);
  assert.ok(rows.every(x=>!JSON.stringify(x).includes("alice@example.org")));
 });
 it("signale les schémas manquants comme inconnus",async()=>{
  const missing={query:async(sql:string)=>{
   if(sql.includes("information_schema.columns"))return {rows:[{present:false}]};
   throw new Error("unexpected read");
  }} as unknown as Client;
  const rows=await inspectMemberRelations(missing,"member-1");
  assert.ok(rows.every(x=>x.state==="unknown"&&x.count===null));
 });
});

describe("SMN-38 — lecture des fichiers privés TXT/PDF",()=>{
 it("cherche uniquement les TXT de l'équipe et signale les PDF potentiels",async()=>{
  const root=await mkdtemp(join(tmpdir(),"smn-erasure-scan-"));
  const add=async(id:string,teamId:string,format:"TXT"|"PDF",body:string)=>{
   const extension=format==="TXT"?"txt":"pdf",bytes=Buffer.from(body);
   const sha256=createHash("sha256").update(bytes).digest("hex");
   await writeFile(join(root,id+"."+extension),bytes);
   await writeFile(join(root,id+".meta.json"),JSON.stringify({
    id,format,teamId,userAuthorized:true,sha256
   }));
  };
  try{
   await add("one","team-1","TXT","Note pour Alice");
   await add("two","team-2","TXT","Note pour Alice");
   await add("three","team-1","PDF","%PDF-1.4 mock");
   const rows=await inspectPrivateDocuments(root,["Alice"],new Set(["team-1"]));
   assert.equal(rows.find(r=>r.table==="private-txt-matches")?.count,1);
   assert.equal(rows.find(r=>r.table==="private-pdf-candidates")?.count,1);
   assert.ok(!JSON.stringify(rows).includes("Note pour Alice"));
  }finally{await rm(root,{recursive:true,force:true});}
 });
 it("ne retourne jamais zéro sur une source absente",async()=>{
  const rows=await inspectPrivateDocuments(undefined,["Alice"],new Set(["team-1"]));
  assert.ok(rows.every(r=>r.state==="unknown"&&r.count===null));
 });
});
