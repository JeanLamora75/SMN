import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {createHash,randomBytes,randomUUID} from "node:crypto";
import {mkdtemp,mkdir,writeFile,readFile,rm} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import type {Client} from "pg";
import {unseal} from "../src/server/backup/crypto";
import {inspectExtraArchives,encryptExtraArchives,validExtraName}
 from "../src/server/backup/extra-archives";

describe("SMN-34 — archivage v3 de documents gérés",()=>{
 it("chiffre les PDF référencés et rapports Office sans modifier les sources",async()=>{
  const root=await mkdtemp(join(tmpdir(),"smn34-v3-files-"));
  const pdfDir=join(root,"pdf"),officeDir=join(root,"office"),staging=join(root,"backup");
  const savedPdf=process.env.SMN_PRIVATE_REPORT_ARCHIVE_DIR;
  const savedOffice=process.env.SMN_OFFICE_REPORTS_DIR;
  const id=randomUUID(),pdf=Buffer.from("%PDF-1.4\nSMN34\n%%EOF\n");
  const office=Buffer.from("PK\u0003\u0004SMN34-officedoc");
  try{
   await Promise.all([pdfDir,officeDir,staging].map(p=>mkdir(p)));
   process.env.SMN_PRIVATE_REPORT_ARCHIVE_DIR=pdfDir;
   process.env.SMN_OFFICE_REPORTS_DIR=officeDir;
   await writeFile(join(pdfDir,id+".pdf"),pdf);
   await writeFile(join(officeDir,"Rapport.docx"),office);
   const db={query:async()=>({rows:[{id,sha256:createHash("sha256")
    .update(pdf).digest("hex"),byte_length:pdf.length,stored_name:id+".pdf"}]})} as unknown as Client;
   const inventory=await inspectExtraArchives(db);
   assert.deepEqual(inventory.pdf.map(x=>x.name),[id+".pdf"]);
   assert.deepEqual(inventory.office.map(x=>x.name),["Rapport.docx"]);
   const key=randomBytes(32);
   const result=await encryptExtraArchives(inventory,key,staging);
   assert.equal(result.pdf.length,1);assert.equal(result.office.length,1);
   for(const [name,part,expected] of [
    ["report-pdfs",result.pdf[0],pdf],["office-reports",result.office[0],office]
   ] as const){
    const cipher=await readFile(join(staging,part.path));
    assert.notDeepEqual(cipher,expected);
    assert.deepEqual(unseal(key,{ciphertext:cipher,nonce:part.nonce,tag:part.tag}),expected);
    assert.ok(part.path.startsWith(name+"/"));
   }
   assert.deepEqual(await readFile(join(pdfDir,id+".pdf")),pdf);
   assert.deepEqual(await readFile(join(officeDir,"Rapport.docx")),office);
  }finally{
   if(savedPdf===undefined)delete process.env.SMN_PRIVATE_REPORT_ARCHIVE_DIR;
   else process.env.SMN_PRIVATE_REPORT_ARCHIVE_DIR=savedPdf;
   if(savedOffice===undefined)delete process.env.SMN_OFFICE_REPORTS_DIR;
   else process.env.SMN_OFFICE_REPORTS_DIR=savedOffice;
   await rm(root,{recursive:true,force:true});
  }
 });
 it("refuse les archives PDF sans référence DB et les chemins Office dangereux",async()=>{
  const root=await mkdtemp(join(tmpdir(),"smn34-v3-orphans-"));
  const before=process.env.SMN_PRIVATE_REPORT_ARCHIVE_DIR;
  const other=process.env.SMN_OFFICE_REPORTS_DIR;
  try{
   const pdfDir=join(root,"pdf"),officeDir=join(root,"office");
   await mkdir(pdfDir);await mkdir(officeDir);
   process.env.SMN_PRIVATE_REPORT_ARCHIVE_DIR=pdfDir;
   process.env.SMN_OFFICE_REPORTS_DIR=officeDir;
   await writeFile(join(pdfDir,randomUUID()+".pdf"),"orphan");
   const db={query:async()=>({rows:[]})} as unknown as Client;
   await assert.rejects(()=>inspectExtraArchives(db),/orphan-or-missing/);
   assert.equal(validExtraName("office","../private.docx"),false);
   assert.equal(validExtraName("pdf","../../archive.pdf"),false);
  }finally{
   if(before===undefined)delete process.env.SMN_PRIVATE_REPORT_ARCHIVE_DIR;
   else process.env.SMN_PRIVATE_REPORT_ARCHIVE_DIR=before;
   if(other===undefined)delete process.env.SMN_OFFICE_REPORTS_DIR;
   else process.env.SMN_OFFICE_REPORTS_DIR=other;
   await rm(root,{recursive:true,force:true});
  }
 });
});
