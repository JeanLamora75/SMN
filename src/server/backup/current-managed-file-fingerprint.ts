import {createHash} from "node:crypto";
import {lstat} from "node:fs/promises";
import type {Client} from "pg";
import {scanDocuments,type SourceDocument} from "./files";
import {inspectExtraArchives,type ExtraInventory} from "./extra-archives";
import {installedPrivateDocumentsDirectory} from "../documents/storage-path";
import type {FileSnapshot} from "./restore-file-cutover-drill";

/**
 * Same canonical path/hash/length stream as inspectRestoreFileTree on the
 * decrypted, reconstructed candidate. No plaintext or member data is returned.
 * Source inventory is checked through existing bounded file validators.
 */
export function fingerprintCurrentFileInventories(
 documents:readonly SourceDocument[],extra:ExtraInventory
):FileSnapshot{
 const names=new Set<string>();
 const rows: {name:string;hash:string;size:number}[]=[];
 const append=(folder:string,name:string,hash:string,size:number)=>{
  const path=folder+"/"+name;
  if(names.has(path)||!name||name==="."||name===".."||
   name.startsWith(".")||! /^[a-f0-9]{64}$/.test(hash)||
   !Number.isSafeInteger(size)||size<=0||size>20*1024*1024)
   throw Error("migration-managed-file-invalid");
  names.add(path);rows.push({name:path,hash,size});
 };
 for(const d of documents)append("documents",d.name,d.hash,d.length);
 for(const d of extra.pdf)append("report-pdfs",d.name,d.hash,d.size);
 for(const d of extra.office)append("office-reports",d.name,d.hash,d.size);
 for(const d of extra.templates)append("office-templates",d.name,d.hash,d.size);
 if(rows.length>2800)throw Error("migration-managed-files-too-many");
 rows.sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0);
 const bytes=rows.reduce((sum,r)=>sum+r.size,0);
 if(bytes>600*1024*1024)throw Error("migration-managed-files-too-large");
 return {sha256:createHash("sha256").update(rows.map(r=>
  r.name+"|"+r.hash+"|"+r.size).join("\n")).digest("hex"),
  count:rows.length,bytes};
}
export async function fingerprintCurrentManagedFiles(
 db:Pick<Client,"query">
):Promise<FileSnapshot>{
 const path=installedPrivateDocumentsDirectory();
 const stat=await lstat(path).catch((error:NodeJS.ErrnoException)=>{
  if(error.code==="ENOENT")return null;
  throw error;
 });
 const docs=stat?await scanDocuments(path):[];
 const extra=await inspectExtraArchives(db);
 return fingerprintCurrentFileInventories(docs,extra);
}
