import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {mkdtemp,rm,writeFile} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {createHash} from "node:crypto";
import {readPrivateDocument} from "../src/server/documents/private-file";
const admin={role:"admin",is_active:true,must_change_password:false};
const user={role:"user",is_active:true,must_change_password:false};
const checksum=(buffer:Buffer)=>createHash("sha256").update(buffer).digest("hex");
describe("SMN-26 private PDF/TXT access",()=>{
 it("rejects missing root and malformed resource IDs",async()=>{
  assert.equal(await readPrivateDocument(undefined,"report","team",user),null);
  assert.equal(await readPrivateDocument("relative","report","team",admin),null);
  assert.equal(await readPrivateDocument("/fake","../outside","team",admin),null);
 });
 it("reads only an explicitly allowed document within current team",async()=>{
  const root=await mkdtemp(join(tmpdir(),"smn-doc-"));
  try {
   const body=Buffer.from("Team status","utf8");
   await writeFile(join(root,"brief.txt"),body);
   await writeFile(join(root,"brief.meta.json"),JSON.stringify({
    id:"brief",teamId:"team",format:"TXT",userAuthorized:true,sha256:checksum(body)}));
   assert.equal((await readPrivateDocument(root,"brief","team",user))?.body.toString(),"Team status");
   assert.equal(await readPrivateDocument(root,"brief","another",user),null);
   assert.equal(await readPrivateDocument(root,"brief","team",{...user,is_active:false}),null);
  }finally{await rm(root,{recursive:true,force:true});}
 });
 it("requires authorization for ordinary users, hashes before returning bytes",async()=>{
  const root=await mkdtemp(join(tmpdir(),"smn-doc-"));
  try {
   const body=Buffer.from("Internal summary");
   await writeFile(join(root,"private.txt"),body);
   await writeFile(join(root,"private.meta.json"),JSON.stringify({
    id:"private",teamId:"team",format:"TXT",userAuthorized:false,sha256:checksum(body)}));
   assert.equal(await readPrivateDocument(root,"private","team",user),null);
   assert.equal((await readPrivateDocument(root,"private","team",admin))?.format,"TXT");
   await writeFile(join(root,"private.txt"),"Changed content");
   assert.equal(await readPrivateDocument(root,"private","team",admin),null);
  }finally{await rm(root,{recursive:true,force:true});}
 });
 it("never serves incorrect file format",async()=>{
  const root=await mkdtemp(join(tmpdir(),"smn-doc-"));
  try {
   const body=Buffer.from("not PDF");
   await writeFile(join(root,"paper.pdf"),body);
   await writeFile(join(root,"paper.meta.json"),JSON.stringify({
    id:"paper",teamId:"team",format:"PDF",userAuthorized:true,sha256:checksum(body)}));
   assert.equal(await readPrivateDocument(root,"paper","team",admin),null);
  }finally{await rm(root,{recursive:true,force:true});}
 });
});
