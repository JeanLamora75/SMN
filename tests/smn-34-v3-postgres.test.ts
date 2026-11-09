import assert from "node:assert/strict";
import {test} from "node:test";
import {randomUUID,createHash} from "node:crypto";
import {mkdtemp,rm,mkdir,writeFile,readFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {Client} from "pg";
import {installExpress} from "../src/server/installation/install";
import {createManualBackup} from "../src/server/backup/runner";
import {inspectBackup} from "../src/server/backup/verification";
import {rehearseBackupRestore} from "../src/server/backup/restore-sandbox";
import {inspectRestoreFileTree} from "../src/server/backup/restore-file-cutover-drill";
import {createDefaultDashboardLayout,saveDashboardLayout,readDashboardLayout} from "../src/server/dashboard-builder/layout";
import {recalculateIndicatorResults} from "../src/server/indicators/recalculation";
import {readIndicatorReporting} from "../src/server/indicators/reporting";
import {extractOoxmlText} from "../src/server/backup/erasure-ooxml-text";
import {validateFinalPdf} from "../src/server/reports/pdf-archive-contract";

function makePdf():Buffer{
 const pieces=["%PDF-1.4\n"];
 const offsets:number[]=[0];let current=Buffer.byteLength(pieces[0]);
 const objects=[
  "<</Type/Catalog /Pages 2 0 R>>",
  "<</Type/Pages /Kids[3 0 R] /Count 1>>",
  "<</Type/Page /Parent 2 0 R /MediaBox[0 0 612 792] /Contents 4 0 R>>",
  "<</Length 0>>\nstream\n\nendstream"
 ];
 for(const [index,content] of objects.entries()){
  offsets.push(current);
  const chunk=(index+1)+" 0 obj\n"+content+"\nendobj\n";
  pieces.push(chunk);current+=Buffer.byteLength(chunk);
 }
 const xref=current;
 pieces.push("xref\n0 5\n0000000000 65535 f \n");
 for(const position of offsets.slice(1))
  pieces.push(String(position).padStart(10,"0")+" 00000 n \n");
 pieces.push("trailer\n<</Size 5 /Root 1 0 R>>\nstartxref\n"+xref+"\n%%EOF\n");
 return Buffer.from(pieces.join(""));
}
function crc32(bytes:Buffer):number{
 let c=0xffffffff;
 for(const b of bytes){c^=b;for(let j=0;j<8;j++)
  c=(c&1)?(c>>>1)^0xedb88320:c>>>1;}
 return (c^0xffffffff)>>>0;
}
function makeDocx():Buffer{
 const entries=[
  {name:"[Content_Types].xml",body:`<?xml version="1.0"?>
  <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml"
   ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  </Types>`},
  {name:"_rels/.rels",body:`<?xml version="1.0"?>
  <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
  Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
  Target="word/document.xml"/></Relationships>`},
  {name:"word/document.xml",body:`<?xml version="1.0"?>
  <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body><w:p><w:r><w:t>Rapport {{TEAM_NAME}} : {{INDICATOR_LOT3_MANUAL}}</w:t></w:r></w:p></w:body></w:document>`}
 ];
 const locals:Buffer[]=[],central:Buffer[]=[];let offset=0;
 for(const item of entries){
  const name=Buffer.from(item.name),body=Buffer.from(item.body),checksum=crc32(body);
  const local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50,0);
  local.writeUInt16LE(20,4);local.writeUInt32LE(checksum,14);
  local.writeUInt32LE(body.length,18);local.writeUInt32LE(body.length,22);
  local.writeUInt16LE(name.length,26);
  locals.push(local,name,body);
  const cd=Buffer.alloc(46);cd.writeUInt32LE(0x02014b50,0);
  cd.writeUInt16LE(20,4);cd.writeUInt16LE(20,6);
  cd.writeUInt32LE(checksum,16);cd.writeUInt32LE(body.length,20);
  cd.writeUInt32LE(body.length,24);cd.writeUInt16LE(name.length,28);
  cd.writeUInt32LE(offset,42);central.push(cd,name);
  offset+=local.length+name.length+body.length;
 }
 const bytes=Buffer.concat(central),eocd=Buffer.alloc(22);
 eocd.writeUInt32LE(0x06054b50,0);
 eocd.writeUInt16LE(entries.length,8);eocd.writeUInt16LE(entries.length,10);
 eocd.writeUInt32LE(bytes.length,12);eocd.writeUInt32LE(offset,16);
 return Buffer.concat([...locals,bytes,eocd]);
}

async function fingerprint(db:Client):Promise<Record<string,{count:number;hash:string}>>{
 const names=await db.query<{tablename:string}>("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename");
 const result:Record<string,{count:number;hash:string}>={};
 for(const {tablename} of names.rows){
  const safe='"'+tablename.replaceAll('"','""')+'"';
  const rows=await db.query<{v:string}>("SELECT to_jsonb(t)::text AS v FROM public."+safe+" AS t");
  const hash=createHash("sha256");
  for(const v of rows.rows.map(row=>row.v).sort())hash.update(v.length+":"+v+"\n");
  result[tablename]={count:rows.rowCount??0,hash:hash.digest("hex")};
 }
 return result;
}


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
 const reports=join(root,"report-pdfs"),office=join(root,"office-reports"),
  templates=join(root,"office-templates");
 const originalEnv={
  SMN_DATABASE_URL:process.env.SMN_DATABASE_URL,
  SMN_BACKUP_DIR:process.env.SMN_BACKUP_DIR,
  SMN_PRIVATE_DOCUMENTS_DIR:process.env.SMN_PRIVATE_DOCUMENTS_DIR,
  SMN_PRIVATE_REPORT_ARCHIVE_DIR:process.env.SMN_PRIVATE_REPORT_ARCHIVE_DIR,
  SMN_OFFICE_REPORTS_DIR:process.env.SMN_OFFICE_REPORTS_DIR,
  SMN_OFFICE_TEMPLATES_DIR:process.env.SMN_OFFICE_TEMPLATES_DIR
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
  await Promise.all([backup,documents,reports,office,templates].map(path=>mkdir(path,{recursive:true})));
  process.env.SMN_DATABASE_URL=url(source);
  process.env.SMN_BACKUP_DIR=backup;
  process.env.SMN_PRIVATE_DOCUMENTS_DIR=documents;
  process.env.SMN_PRIVATE_REPORT_ARCHIVE_DIR=reports;
  process.env.SMN_OFFICE_REPORTS_DIR=office;
  process.env.SMN_OFFICE_TEMPLATES_DIR=templates;
  assert.deepEqual(await installExpress({adminUsername:"smn34",
   adminEmail:"smn34@example.test",password:"TestPassword-SMN-34-2026"},url(source)),{ok:true});
  const db=new Client({connectionString:url(source)});
  let actor:{id:string;role:string;password_hash:string};
  const pdfId=randomUUID(),teamId=randomUUID(),sprintId=randomUUID();
  const team2=randomUUID(),sprint2=randomUUID(),sprint3=randomUUID();
  let snapshot:Record<string,{count:number;hash:string}>;
  const pdf=makePdf();
  const officeBytes=makeDocx();
  assert.ok(validateFinalPdf(pdf));
  assert.equal(extractOoxmlText(officeBytes).state,"extracted");
  try{
   await db.connect();
   const account=await db.query<{id:string;role:string;password_hash:string}>(
    "SELECT id,role,password_hash FROM public.smn_account WHERE username='smn34'");
   actor=account.rows[0];
   assert.ok(actor?.id);
   await db.query("UPDATE public.smn_account SET must_change_password=false WHERE id=$1",[actor.id]);
   await db.query("INSERT INTO public.smn_team(id,installation_id,name,agile_mode) VALUES($1,'singleton','Restauration SMN 34','scrum')",[teamId]);
   await db.query(`INSERT INTO public.smn_sprint
    (id,team_id,number,name,start_at,end_at,time_zone,status)
    VALUES($1,$2,1,'Restauration',now()-interval '2 days',now(),'Europe/Paris','finished')`,
    [sprintId,teamId]);

   await db.query("INSERT INTO public.smn_team(id,installation_id,name,agile_mode) VALUES($1,'singleton','Equipe B','scrum')",[team2]);
   await db.query("INSERT INTO public.smn_sprint(id,team_id,number,name,start_at,end_at,time_zone,status) VALUES($1,$3,2,'Sprint 2',now()+interval '2 days',now()+interval '16 days','Europe/Paris','planned'),($2,$4,1,'Sprint B1',now()-interval '10 days',now()-interval '2 days','Europe/Paris','finished')",[sprint2,sprint3,teamId,team2]);
   const member=randomUUID(),batch=randomUUID();
   await db.query("INSERT INTO public.smn_member_batch(id,installation_id,team_id,requested_count) VALUES($1,'singleton',$2,3)",[batch,teamId]);
   await db.query("INSERT INTO public.smn_member(id,installation_id,batch_id,member_number,display_name) VALUES($1,'singleton',$2,1,'Test member')",[member,batch]);
   await db.query("INSERT INTO public.smn_indicator_definition(id,tag,name,indicator_type,formula) VALUES('lot3manual','LOT3_MANUAL','Manual indicator','manual',NULL),('lot3computed','LOT3_COMPUTED','Computed indicator','computed','LOT3_MANUAL*2')");
   await db.query("INSERT INTO public.smn_indicator_dependency(id,indicator_id,source_type,source_indicator_id) VALUES('lot3dep','lot3computed','indicator','lot3manual')");
   await db.query("INSERT INTO public.smn_indicator_team_selection(team_id,indicator_id) VALUES($1,'lot3manual'),($1,'lot3computed'),($2,'lot3manual')",[teamId,team2]);
   await db.query("INSERT INTO public.smn_indicator_display_preference(team_id,indicator_id,screen_key,is_visible,display_order,display_style) VALUES($1,'lot3manual','reports',true,1,'number')",[teamId]);
   await db.query("INSERT INTO public.smn_indicator_manual_value(team_id,cycle_type,cycle_id,indicator_id,value,updated_by) VALUES($1,'scrum',$2,'lot3manual',13,$3),($4,'scrum',$5,'lot3manual',5,$3)",[teamId,sprintId,actor.id,team2,sprint3]);
   const assignment=randomUUID();
   await db.query("INSERT INTO public.smn_member_assignment(id,member_id,team_id,start_on,agile_role) VALUES($1,$2,$3,'2026-09-01','developer')",[assignment,member,teamId]);
   await db.query("INSERT INTO public.smn_member_assignment_version(id,assignment_id,revision,effective_from,allocation_percent,contract_percent,contribution_percent,scrum_master_percent,product_owner_percent,developer_percent) VALUES($1,$2,1,'2026-09-01',100,100,100,0,0,100)",[randomUUID(),assignment]);
   const layout=createDefaultDashboardLayout("scrum");
   assert.equal((await saveDashboardLayout(db,{installationId:"singleton",accountId:actor.id,teamId},layout,0)).revision,1);
   assert.equal((await readDashboardLayout(db,{installationId:"singleton",accountId:actor.id,teamId})).persisted,true);

   const category=randomUUID(),linkGlobal=randomUUID(),linkTeam=randomUUID(),risk=randomUUID();
   await db.query("INSERT INTO public.smn_link_category(id,installation_id,name) VALUES($1,'singleton','Liens de recette')",[category]);
   await db.query("INSERT INTO public.smn_link(id,installation_id,title,url,category_id,scope,created_by) VALUES($1,'singleton','Documentation transversale','https://example.test/global',$2,'TRANSVERSE',$3)",[linkGlobal,category,actor.id]);
   await db.query("INSERT INTO public.smn_link(id,installation_id,title,url,category_id,scope,team_id,created_by) VALUES($1,'singleton','Documentation equipe','https://example.test/team',$2,'EQUIPE',$3,$4)",[linkTeam,category,teamId,actor.id]);
   await db.query("INSERT INTO public.smn_registry_item(id,installation_id,team_id,type,title,occurred_on,status,created_by) VALUES($1,'singleton',$2,'risk','Risque sauvegarde','2026-11-09','open',$3)",[risk,teamId,actor.id]);
   await db.query("INSERT INTO public.smn_registry_comment(id,item_id,body,author_name) VALUES($1,$2,'Historique du risque','test')",[randomUUID(),risk]);
   const pdfHash=createHash("sha256").update(pdf).digest("hex");
   await writeFile(join(reports,pdfId+".pdf"),pdf,{flag:"wx"});
   await db.query(`INSERT INTO public.smn_report_pdf_archive
    (id,sha256,byte_length,stored_name,created_at,author_id,language,template_id,
     team_id,cycle_id,cycle_status,manifest)
    VALUES($1,$2,$3,$4,now(),$5,'fr','smn34',$6,$7,'finished',$8::jsonb)`,
    [pdfId,pdfHash,pdf.length,pdfId+".pdf",actor.id,teamId,sprintId,
     JSON.stringify({id:pdfId,sha256:pdfHash,byteLength:pdf.length,teamId,cycleId:sprintId})]);
   await writeFile(join(office,"Rapport-SMN34.docx"),officeBytes,{flag:"wx"});
   await writeFile(join(templates,"Modele-SMN34.docx"),officeBytes,{flag:"wx"});
   const note=Buffer.from("Compte rendu sprint sauvegardé","utf8");
   const docId="smn34-document";
   await writeFile(join(documents,docId+".txt"),note);
   await writeFile(join(documents,docId+".meta.json"),JSON.stringify({
    id:docId,teamId,format:"TXT",userAuthorized:true,
    sha256:createHash("sha256").update(note).digest("hex")
   }));
   snapshot=await fingerprint(db);
   assert.equal(snapshot.smn_team.count,2);
   assert.equal(snapshot.smn_sprint.count,3);
   assert.equal(snapshot.smn_member.count,1);
   assert.equal(snapshot.smn_indicator_manual_value.count,2);
   assert.equal(snapshot.smn_dashboard_layout.count,1);
   assert.equal(snapshot.smn_member_assignment.count,1);
   assert.equal(snapshot.smn_link.count,2);
   assert.equal(snapshot.smn_registry_item.count,1);
  }finally{await db.end().catch(()=>undefined);}
  const captured=await createManualBackup(actor!,"Phrase de récupération dédiée pour recette SMN 34!");
  assert.equal(captured.status,"success");
  const key=await import("node:fs/promises").then(fs=>fs.readFile(join(backup,".backup-key")));
  try{
   const check=await inspectBackup(backup,captured.id,key);
   assert.equal(check.status,"verified");
   assert.ok(check.components.some(c=>c.kind==="report-pdf"));
   assert.ok(check.components.some(c=>c.kind==="office-report"));
    assert.ok(check.components.some(c=>c.kind==="office-template"));
  }finally{key.fill(0);}
  const stagedFileRoot=join(root,"smn_restore_test_files_"+suffix);
  const rehearsal=await rehearseBackupRestore({sourceUri:url(source),
   sandboxUri:url(target),backupRoot:backup,archiveId:captured.id,
   stagingFilesOutput:stagedFileRoot});
  assert.equal(rehearsal.status,"reconstructed-in-sandbox");
  assert.equal(rehearsal.verifiedReportPdfs,1);
  assert.equal(rehearsal.verifiedOfficeReports,1);
   assert.equal(rehearsal.verifiedOfficeTemplates,1);
  assert.equal(rehearsal.verifiedDocuments,1);
  assert.equal(rehearsal.missingDocumentReferences,0);
  assert.equal(rehearsal.databaseAndDocumentsConsistent,true);
  assert.equal(rehearsal.activeInstallationModified,false);
  assert.equal(rehearsal.fullRestoreQualified,false);
  assert.equal(rehearsal.fileStagingRetained,true);
  const fileSnapshot=await inspectRestoreFileTree(stagedFileRoot);
  assert.equal(fileSnapshot.sha256,rehearsal.fileSnapshotSha256);
  assert.equal(fileSnapshot.count,5);
  assert.deepEqual(await readFile(join(stagedFileRoot,"report-pdfs",pdfId+".pdf")),pdf);
  assert.deepEqual(await readFile(join(stagedFileRoot,"office-reports","Rapport-SMN34.docx")),officeBytes);
  assert.deepEqual(await readFile(join(stagedFileRoot,"office-templates","Modele-SMN34.docx")),officeBytes);
  assert.deepEqual(await readFile(join(stagedFileRoot,"documents","smn34-document.txt")),note);

  const restored=new Client({connectionString:url(target)});
  try{
   await restored.connect();
   const refs=await restored.query<{sha256:string;stored_name:string}>(
    "SELECT sha256,stored_name FROM public.smn_report_pdf_archive WHERE id=$1",[pdfId]);
   assert.equal(refs.rows.length,1);
   assert.equal(refs.rows[0].stored_name,pdfId+".pdf");
   assert.equal(refs.rows[0].sha256,createHash("sha256").update(pdf).digest("hex"));
   assert.deepEqual(await fingerprint(restored),snapshot,
    "Every public table must have identical rows after reconstruction");
   const values=await restored.query<{value:string}>("SELECT value::text FROM public.smn_indicator_manual_value WHERE team_id=$1 AND cycle_id=$2 AND indicator_id='lot3manual'",[teamId,sprintId]);
   assert.equal(values.rows[0].value,"13");
   const restoredLayout=await readDashboardLayout(restored,{installationId:"singleton",accountId:actor.id,teamId});
   assert.equal(restoredLayout.persisted,true);
   assert.equal(restoredLayout.revision,1);
   const indicators=await readIndicatorReporting(restored,teamId,"reports","scrum",[sprintId]);
   assert.equal(indicators.cycles[0].values.lot3manual,"13");
   const recalculated=await recalculateIndicatorResults(restored,{
    teamId,cycles:[{teamId,cycleType:"scrum",cycleId:sprintId}]});
   assert.ok(recalculated.results>=1,"Computed indicators must recalculate after restoration");
   const computed=await restored.query<{value:string;result_state:string}>(
    "SELECT value::text,result_state FROM public.smn_indicator_computed_result WHERE team_id=$1 AND cycle_id=$2 AND indicator_id='lot3computed'",[teamId,sprintId]);
   assert.deepEqual(computed.rows,[{value:"26",result_state:"available"}]);
   // Regenerate an actual DOCX from the backed-up template and restored v33 data.
   const officeGenerator=await import(new URL("../scripts/smn-399-office-scalars.mjs",import.meta.url).href) as {
    buildScalarValues:(v:unknown)=>Record<string,string|null>;
    generateScalarOffice:(input:Buffer,format:string,values:unknown)=>{bytes:Buffer;changes:unknown[]};
   };
   const teamRow=await restored.query<{name:string}>("SELECT name FROM public.smn_team WHERE id=$1",[teamId]);
   const replaced=officeGenerator.generateScalarOffice(officeBytes,"docx",
    officeGenerator.buildScalarValues({
     TEAM_NAME:teamRow.rows[0].name,
     indicators:[{tag:"LOT3_MANUAL",available:true,value:values.rows[0].value}]
    }));
   assert.equal(replaced.changes.length,1);
   const regenerated=extractOoxmlText(replaced.bytes);
   assert.equal(regenerated.state,"extracted");
   assert.match(regenerated.text??"",/Restauration SMN 34/);
   assert.match(regenerated.text??"",/13/);
   assert.doesNotMatch(regenerated.text??"",/\{\{TEAM_NAME\}\}/);

  }finally{await restored.end().catch(()=>undefined);}
  // Prove that rehearsing the restoration did not remove or rewrite the source.
  const unchanged=new Client({connectionString:url(source)});
  try{
   await unchanged.connect();
   const original=await unchanged.query<{sha256:string}>(`
    SELECT sha256 FROM public.smn_report_pdf_archive WHERE id=$1`,[pdfId]);
   assert.equal(original.rows[0]?.sha256,
    createHash("sha256").update(pdf).digest("hex"));
  }finally{await unchanged.end().catch(()=>undefined);}
  process.stdout.write(JSON.stringify({
   evidence:"EPIC2-LOT2-v4-PG18-sandbox",sandbox:true,
   pdfCount:rehearsal.verifiedReportPdfs,
   officeCount:rehearsal.verifiedOfficeReports,
   templateCount:rehearsal.verifiedOfficeTemplates,
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
