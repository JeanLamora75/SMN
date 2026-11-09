import assert from "node:assert/strict";
import {test} from "node:test";
import {randomUUID,createHash} from "node:crypto";
import {mkdtemp,rm,mkdir,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {Client} from "pg";
import {installExpress} from "../src/server/installation/install";
import {createManualBackup} from "../src/server/backup/runner";
import {inspectBackup} from "../src/server/backup/verification";
import {rehearseBackupRestore} from "../src/server/backup/restore-sandbox";

test("SMN-34 PostgreSQL 18 — paquet v3 et reconstruction réellement isolée",
 {timeout:240000},async()=>{
 const envUri=process.env.SMN_TEST_DATABASE_URL;
 if(!envUri)throw Error("SMN_TEST_DATABASE_URL required — no implicit production fallback");
 const maintenance=new URL(envUri);
 if(!["localhost","127.0.0.1","::1"].includes(maintenance.hostname)||
  decodeURIComponent(maintenance.pathname)!=="/postgres")
  throw Error("PostgreSQL 18 LOCAL maintenance database required");
 const suffix=randomUUID().replaceAll("-","").slice(0,12);
 const source="smn_restore_source_"+suffix,target="smn_restore_test_"+suffix;
 const url=(name:string)=>{const uri=new URL(maintenance);uri.pathname="/"+name;return uri.toString();};
 const root=await mkdtemp(join(tmpdir(),"smn34-full-backup-"));
 const backup=join(root,"backups"),documents=join(root,"private-documents");
 const reports=join(root,"report-pdfs"),office=join(root,"office-reports");
 const originalEnv={
  SMN_DATABASE_URL:process.env.SMN_DATABASE_URL,
  SMN_BACKUP_DIR:process.env.SMN_BACKUP_DIR,
  SMN_PRIVATE_DOCUMENTS_DIR:process.env.SMN_PRIVATE_DOCUMENTS_DIR,
  SMN_PRIVATE_REPORT_ARCHIVE_DIR:process.env.SMN_PRIVATE_REPORT_ARCHIVE_DIR,
  SMN_OFFICE_REPORTS_DIR:process.env.SMN_OFFICE_REPORTS_DIR
 };
 const admin=new Client({connectionString:maintenance.toString(),connectionTimeoutMillis:3500});
 const owned:string[]=[];
 try{
  await admin.connect();
  const server=await admin.query<{v:string}>("SELECT current_setting('server_version') AS v");
  assert.ok(server.rows[0].v.startsWith("18."),"PostgreSQL 18 required");
  for(const name of [source,target]){
   assert.match(name,/^smn_restore_(?:source|test)_[a-f0-9]{12}$/);
   await admin.query('CREATE DATABASE "'+name+'"');
   owned.push(name);
  }
  await Promise.all([backup,documents,reports,office].map(path=>mkdir(path,{recursive:true})));
  process.env.SMN_DATABASE_URL=url(source);
  process.env.SMN_BACKUP_DIR=backup;
  process.env.SMN_PRIVATE_DOCUMENTS_DIR=documents;
  process.env.SMN_PRIVATE_REPORT_ARCHIVE_DIR=reports;
  process.env.SMN_OFFICE_REPORTS_DIR=office;
  assert.deepEqual(await installExpress({adminUsername:"smn34",
   adminEmail:"smn34@example.test",password:"TestPassword-SMN-34-2026"},url(source)),{ok:true});
  const db=new Client({connectionString:url(source)});
  let actor:{id:string;role:string;password_hash:string};
  const pdfId=randomUUID(),teamId=randomUUID(),sprintId=randomUUID();
  const pdf=Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n");
  const officeBytes=Buffer.from("PK\u0003\u0004demo-office-report");
  try{
   await db.connect();
   const account=await db.query<{id:string;role:string;password_hash:string}>(
    "SELECT id,role,password_hash FROM public.smn_account WHERE username='smn34'");
   actor=account.rows[0];
   assert.ok(actor?.id);
   await db.query("INSERT INTO public.smn_team(id,installation_id,name,agile_mode) VALUES($1,'singleton','Restauration SMN 34','scrum')",[teamId]);
   await db.query(`INSERT INTO public.smn_sprint
    (id,team_id,number,name,start_at,end_at,time_zone,status)
    VALUES($1,$2,1,'Restauration',now()-interval '2 days',now(),'Europe/Paris','finished')`,
    [sprintId,teamId]);
   const pdfHash=createHash("sha256").update(pdf).digest("hex");
   await writeFile(join(reports,pdfId+".pdf"),pdf,{flag:"wx"});
   await db.query(`INSERT INTO public.smn_report_pdf_archive
    (id,sha256,byte_length,stored_name,created_at,author_id,language,template_id,
     team_id,cycle_id,cycle_status,manifest)
    VALUES($1,$2,$3,$4,now(),$5,'fr','smn34',$6,$7,'finished',$8::jsonb)`,
    [pdfId,pdfHash,pdf.length,pdfId+".pdf",actor.id,teamId,sprintId,
     JSON.stringify({id:pdfId,sha256:pdfHash,byteLength:pdf.length,teamId,cycleId:sprintId})]);
   await writeFile(join(office,"Rapport-SMN34.docx"),officeBytes,{flag:"wx"});
   const note=Buffer.from("Compte rendu sprint sauvegardé","utf8");
   const docId="smn34-document";
   await writeFile(join(documents,docId+".txt"),note);
   await writeFile(join(documents,docId+".meta.json"),JSON.stringify({
    id:docId,teamId,format:"TXT",userAuthorized:true,
    sha256:createHash("sha256").update(note).digest("hex")
   }));
  }finally{await db.end().catch(()=>undefined);}
  const captured=await createManualBackup(actor!,"Phrase de récupération dédiée pour recette SMN 34!");
  assert.equal(captured.status,"success");
  const key=await import("node:fs/promises").then(fs=>fs.readFile(join(backup,".backup-key")));
  try{
   const check=await inspectBackup(backup,captured.id,key);
   assert.equal(check.status,"verified");
   assert.ok(check.components.some(c=>c.kind==="report-pdf"));
   assert.ok(check.components.some(c=>c.kind==="office-report"));
  }finally{key.fill(0);}
  const rehearsal=await rehearseBackupRestore({sourceUri:url(source),
   sandboxUri:url(target),backupRoot:backup,archiveId:captured.id});
  assert.equal(rehearsal.status,"reconstructed-in-sandbox");
  assert.equal(rehearsal.verifiedReportPdfs,1);
  assert.equal(rehearsal.verifiedOfficeReports,1);
  assert.equal(rehearsal.verifiedDocuments,1);
  assert.equal(rehearsal.missingDocumentReferences,0);
  assert.equal(rehearsal.databaseAndDocumentsConsistent,true);
  assert.equal(rehearsal.activeInstallationModified,false);
  assert.equal(rehearsal.fullRestoreQualified,false);
  const restored=new Client({connectionString:url(target)});
  try{
   await restored.connect();
   const refs=await restored.query<{sha256:string;stored_name:string}>(
    "SELECT sha256,stored_name FROM public.smn_report_pdf_archive WHERE id=$1",[pdfId]);
   assert.equal(refs.rows.length,1);
   assert.equal(refs.rows[0].stored_name,pdfId+".pdf");
   assert.equal(refs.rows[0].sha256,createHash("sha256").update(pdf).digest("hex"));
  }finally{await restored.end().catch(()=>undefined);}
  process.stdout.write(JSON.stringify({
   evidence:"SMN-34-v3-PG18-sandbox",sandbox:true,
   pdfCount:rehearsal.verifiedReportPdfs,
   officeCount:rehearsal.verifiedOfficeReports,
   privateCount:rehearsal.verifiedDocuments,
   databaseAndDocumentsConsistent:true,
   activeInstallationModified:false
  })+"\n");
 }finally{
  for(const [key,value] of Object.entries(originalEnv)){
   if(value===undefined)delete process.env[key];else process.env[key]=value;
  }
  try{
   for(const name of owned.reverse()){
    if(!/^smn_restore_(?:source|test)_[a-f0-9]{12}$/.test(name))
     throw Error("unsafe test database cleanup");
    await admin.query('DROP DATABASE "'+name+'" WITH (FORCE)');
   }
  }finally{
   await admin.end().catch(()=>undefined);
   await rm(root,{recursive:true,force:true});
  }
 }
});
