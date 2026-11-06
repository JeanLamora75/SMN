import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,mkdir,rm,symlink,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {writeZip} from "../scripts/smn-397-office-poc.mjs";
import {isSupportedOfficePackage,listOfficeTemplates,officeTemplatesDirectory,templateIdentifier} from "../src/server/reports/office-catalog";

function makePackage(format:"docx"|"pptx"):Buffer{
 const entries=[
  {name:"[Content_Types].xml",data:Buffer.from(`<Types><Override PartName="/${format==="docx"?"word/document.xml":"ppt/presentation.xml"}" ContentType="application/vnd.openxmlformats-officedocument.${format==="docx"?"wordprocessingml.document.main+xml":"presentationml.presentation.main+xml"}"/></Types>`)},
  {name:"_rels/.rels",data:Buffer.from('<Relationships><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"/></Relationships>')},
  {name:format==="docx"?"word/document.xml":"ppt/presentation.xml",data:Buffer.from("<Document/>")}
 ];
 return writeZip(entries);
}
test("SMN-398: Word and PowerPoint are discovered on refresh, removed files disappear",async()=>{
 const root=await mkdtemp(path.join(tmpdir(),"smn398-"));
 try{
  assert.deepEqual(await listOfficeTemplates(root),[]);
  await writeFile(path.join(root,"Bilan du sprint.docx"),makePackage("docx"));
  await writeFile(path.join(root,"PI Planning.pptx"),makePackage("pptx"));
  const list=await listOfficeTemplates(root);
  assert.equal(list.length,2);
  assert.deepEqual(new Set(list.map(item=>item.format)),new Set(["docx","pptx"]));
  assert.ok(list.every(item=>item.id===templateIdentifier(item.filename)));
  assert.ok(list.every(item=>!item.id.includes(root)));
  await rm(path.join(root,"PI Planning.pptx"));
  assert.deepEqual((await listOfficeTemplates(root)).map(item=>item.filename),["Bilan du sprint.docx"]);
 }finally{await rm(root,{recursive:true,force:true});}
});
test("SMN-398: invalid extensions, temporary files and malformed ZIP are excluded",async()=>{
 const root=await mkdtemp(path.join(tmpdir(),"smn398-"));
 try{
  await writeFile(path.join(root,"~$document.docx"),makePackage("docx"));
  await writeFile(path.join(root,".hidden.docx"),makePackage("docx"));
  await writeFile(path.join(root,"model.docm"),makePackage("docx"));
  await writeFile(path.join(root,"broken.docx"),Buffer.from("fake"));
  await writeFile(path.join(root,"false.pptx"),makePackage("docx"));
  await writeFile(path.join(root,"allowed.docx"),makePackage("docx"));
  assert.deepEqual((await listOfficeTemplates(root)).map(x=>x.filename),["allowed.docx"]);
 }finally{await rm(root,{recursive:true,force:true});}
});
test("SMN-398: symbolic links, missing folders and non-directory roots are rejected",async()=>{
 const root=await mkdtemp(path.join(tmpdir(),"smn398-"));
 try{
  const allowed=path.join(root,"models");
  await mkdir(allowed);
  const external=path.join(root,"outside.docx");
  await writeFile(external,makePackage("docx"));
  await symlink(external,path.join(allowed,"linked.docx"));
  assert.deepEqual(await listOfficeTemplates(allowed),[]);
  assert.deepEqual(await listOfficeTemplates(path.join(root,"missing")),[]);
  await assert.rejects(()=>listOfficeTemplates(external),/office-template-directory-invalid/);
  await symlink(allowed,path.join(root,"alias"),"dir");
  await assert.rejects(()=>listOfficeTemplates(path.join(root,"alias")),/office-template-directory-invalid/);
 }finally{await rm(root,{recursive:true,force:true});}
});
test("SMN-398: only absolute configured folders are accepted",()=>{
 assert.equal(officeTemplatesDirectory({...process.env,SMN_OFFICE_TEMPLATES_DIR:"/tmp/test"}),"/tmp/test");
 assert.throws(()=>officeTemplatesDirectory({...process.env,SMN_OFFICE_TEMPLATES_DIR:"../../outside"}),/not-absolute/);
});
test("SMN-398: malformed, oversized or unsupported Office ZIP packages are rejected",()=>{
 assert.equal(isSupportedOfficePackage(makePackage("docx"),"docx"),true);
 assert.equal(isSupportedOfficePackage(makePackage("pptx"),"pptx"),true);
 assert.equal(isSupportedOfficePackage(makePackage("docx"),"pptx"),false);
 assert.equal(isSupportedOfficePackage(Buffer.from("not a zip"),"docx"),false);
 assert.equal(isSupportedOfficePackage(Buffer.alloc(20*1024*1024+1),"docx"),false);
});
