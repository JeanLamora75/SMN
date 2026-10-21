import {createDecipheriv,createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {open,lstat,readdir} from "node:fs/promises";
import {join} from "node:path";
import {unseal} from "./crypto";
import {privateFolder,safeAtomicJson,sha,type BackupComponent,type BackupIndex} from "./files";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HASH=/^[0-9a-f]{64}$/;
const HEX12=/^[0-9a-f]{24}$/;
const HEX16=/^[0-9a-f]{32}$/;
const DOCUMENT=/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}\.(?:meta\.json|txt|pdf)$/;
const MAX_MANIFEST=4*1024*1024;
const MAX_DOCUMENT=12*1024*1024;
const MAX_DATABASE=8*1024*1024*1024;

export type VerificationStatus="verified"|"invalid"|"incomplete"|"unverifiable";
export type VerifiedComponent=Readonly<{
 path:string;kind:"database"|"document";size:number;encryptedSize:number;encryptedSha256:string;
}>;
export type BackupInventoryEntry=Readonly<{
 id:string;createdAt:string|null;status:VerificationStatus;reason:string|null;
 checkedAt:string;installationSource:string|null;applicationVersion:string|null;
 schemaVersion:number|null;postgresVersion:string|null;
 components:readonly VerifiedComponent[];documentCount:number;
 integrityVerified:boolean;restoreTested:false;
}>;

class VerificationProblem extends Error {
 constructor(public status:VerificationStatus,public code:string){super(code);}
}
const invalid=(code:string):never=>{throw new VerificationProblem("invalid",code);};
const incomplete=(code:string):never=>{throw new VerificationProblem("incomplete",code);};
const record=(value:unknown):Record<string,unknown>|null=>
 value!==null&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:null;
const utc=(value:unknown):value is string=>
 typeof value==="string"&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value;
const component=(value:unknown):value is BackupComponent=>{
 const v=record(value);
 return !!v&&typeof v.path==="string"&&typeof v.size==="number"&&
 Number.isSafeInteger(v.size)&&v.size>=0&&typeof v.encryptedSize==="number"&&
 Number.isSafeInteger(v.encryptedSize)&&v.encryptedSize>=0&&
 typeof v.sha256==="string"&&HASH.test(v.sha256)&&
 typeof v.encryptedSha256==="string"&&HASH.test(v.encryptedSha256)&&
 typeof v.nonce==="string"&&HEX12.test(v.nonce)&&
 typeof v.tag==="string"&&HEX16.test(v.tag);
};
const envelopeValid=(value:unknown):boolean=>{
 const v=record(value);
 return !!v&&v.version===1&&v.kdf==="scrypt"&&typeof v.salt==="string"&&HEX16.test(v.salt)&&
 typeof v.nonce==="string"&&HEX12.test(v.nonce)&&
 typeof v.tag==="string"&&HEX16.test(v.tag)&&
 typeof v.wrappedKey==="string"&&HASH.test(v.wrappedKey);
};

/** Only regular files are read. O_NOFOLLOW closes the symlink race on supported platforms. */
async function safeOpen(path:string){
 try{
  const link=await lstat(path);
  if(!link.isFile()||link.isSymbolicLink())invalid("component-not-regular");
  const fd=await open(path,fsConstants.O_RDONLY|
   (process.platform==="win32"?0:fsConstants.O_NOFOLLOW));
  const stat=await fd.stat();
  if(!stat.isFile()){await fd.close();invalid("component-not-file");}
  return {fd,stat};
 }catch(error){
  if(error instanceof VerificationProblem)throw error;
  if(error&&typeof error==="object"&&"code" in error&&error.code==="ENOENT")
   incomplete("component-missing");
  invalid("component-unreadable");
 }
}
async function smallFile(path:string,max:number):Promise<Buffer>{
 const {fd,stat}=await safeOpen(path);
 try{
  if(stat.size>max||stat.size===0)invalid("component-size-invalid");
  const bytes=await fd.readFile();
  if(bytes.length!==stat.size)invalid("component-changed");
  return bytes;
 }finally{await fd.close();}
}

/** Decrypt and hash in memory-bounded chunks; never materialize the PostgreSQL dump. */
async function verifyEncrypted(path:string,meta:BackupComponent,key:Buffer,
 limit:number,keepPlaintext:boolean):Promise<Buffer|null>{
 const {fd,stat}=await safeOpen(path);
 let stream:ReturnType<typeof fd.createReadStream>|undefined;
 try{
  if(stat.size!==meta.encryptedSize||stat.size>limit||stat.size<1)
   invalid("component-size-mismatch");
  const encryptedHash=createHash("sha256"),plainHash=createHash("sha256");
  const decipher=createDecipheriv("aes-256-gcm",key,Buffer.from(meta.nonce,"hex"));
  decipher.setAuthTag(Buffer.from(meta.tag,"hex"));
  let plainSize=0,encryptionSize=0,header=Buffer.alloc(0);
  const parts:Buffer[]=[];
  stream=fd.createReadStream({autoClose:false});
  try{
   for await(const raw of stream){
    const chunk=Buffer.isBuffer(raw)?raw:Buffer.from(raw);
    encryptionSize+=chunk.length;
    encryptedHash.update(chunk);
    const plain=decipher.update(chunk);
    plainSize+=plain.length;
    plainHash.update(plain);
    if(header.length<5)header=Buffer.concat([header,plain.subarray(0,5-header.length)]);
    if(keepPlaintext)parts.push(plain);
    if(plainSize>limit)invalid("component-too-large");
   }
   const tail=decipher.final();
   plainSize+=tail.length;plainHash.update(tail);
   if(keepPlaintext)parts.push(tail);
   if(header.length<5)header=Buffer.concat([header,tail.subarray(0,5-header.length)]);
  }catch(error){
   if(error instanceof VerificationProblem)throw error;
   invalid("component-authentication-failed");
  }
  if(encryptionSize!==meta.encryptedSize||
   encryptedHash.digest("hex")!==meta.encryptedSha256||
   plainSize!==meta.size||plainHash.digest("hex")!==meta.sha256)
   invalid("component-hash-mismatch");
  if(meta.path==="database.pgcustom.enc"&&header.toString("ascii")!=="PGDMP")
   invalid("database-format-invalid");
  return keepPlaintext?Buffer.concat(parts):null;
 }finally{
  stream?.destroy();
  await fd.close();
 }
}

function publicFailure(id:string,checkedAt:string,status:VerificationStatus,
 reason:string,createdAt:string|null=null):BackupInventoryEntry{
 return {id,createdAt,status,reason,checkedAt,installationSource:null,applicationVersion:null,
  schemaVersion:null,postgresVersion:null,components:[],documentCount:0,
  integrityVerified:false,restoreTested:false};
}

/** Never trust a cached verification result. Each call rechecks on-disk ciphertext. */
export async function inspectBackup(root:string,id:string,key:Buffer|null):
 Promise<BackupInventoryEntry>{
 const checkedAt=new Date().toISOString();
 if(!UUID.test(id))return publicFailure(id,checkedAt,"invalid","package-name-invalid");
 let createdAt:string|null=null;
 try{
  const folder=join(root,"packages",id);
  const stat=await lstat(folder).catch(()=>incomplete("package-missing"));
  if(!stat.isDirectory()||stat.isSymbolicLink())invalid("package-not-directory");
  const rawIndex=await smallFile(join(folder,"index.json"),MAX_MANIFEST);
  let parsed:unknown;
  try{parsed=JSON.parse(rawIndex.toString("utf8"));}catch{invalid("index-json-invalid");}
  const index=record(parsed);
  if(!index||index.version!==1||index.id!==id||!utc(index.createdAt)||
   !envelopeValid(index.recovery))invalid("index-invalid");
  createdAt=index.createdAt as string;
  const info=record(index.encryptedManifest);
  const manifestMeta={...info,path:"manifest.enc"};
  if(!component(manifestMeta)||manifestMeta.size>MAX_MANIFEST||
   manifestMeta.encryptedSize>MAX_MANIFEST)invalid("index-manifest-invalid");
  if(!key)return publicFailure(id,checkedAt,"unverifiable","local-key-unavailable",createdAt);
  const ciphertext=await smallFile(join(folder,"manifest.enc"),MAX_MANIFEST);
  if(ciphertext.length!==manifestMeta.encryptedSize||
   sha(ciphertext)!==manifestMeta.encryptedSha256)invalid("manifest-hash-mismatch");
  let clear:Buffer;
  try{clear=unseal(key,{ciphertext,nonce:manifestMeta.nonce,tag:manifestMeta.tag});}
  catch{invalid("manifest-authentication-failed");}
  if(clear.length!==manifestMeta.size||sha(clear)!==manifestMeta.sha256)
   invalid("manifest-hash-mismatch");
  let parsedManifest:unknown;
  try{parsedManifest=JSON.parse(clear.toString("utf8"));}catch{invalid("manifest-json-invalid");}
  finally{clear.fill(0);}
  const manifest=record(parsedManifest);
  if(!manifest||(manifest.version!==1&&manifest.version!==2)||
   manifest.id!==id||manifest.createdAt!==createdAt||
   manifest.installation!=="singleton"||!Number.isSafeInteger(manifest.schemaVersion)||
   (manifest.schemaVersion as number)<1||
   typeof manifest.postgresVersion!=="string"||
   !/^18(?:\.|$)/.test(manifest.postgresVersion)||
   !Array.isArray(manifest.documents))invalid("manifest-invalid");
  if(manifest.version===2&&
   (typeof manifest.appVersion!=="string"||manifest.appVersion.length>80||
    !/^[0-9]+\.[0-9]+\.[0-9]+/.test(manifest.appVersion)||
    typeof manifest.installationSource!=="string"||
    manifest.installationSource.length>160||
    !manifest.installationSource.startsWith("singleton:")))
   invalid("manifest-origin-invalid");
  const database=manifest.database;
  if(!component(database)||database.path!=="database.pgcustom.enc"||
   database.size>MAX_DATABASE||database.encryptedSize>MAX_DATABASE)
   invalid("database-metadata-invalid");
  if(manifest.documents.length>2000||manifest.documents.length%2!==0)
   invalid("documents-inventory-invalid");
  const documents:({sourceName:string}&BackupComponent)[]=[];
  const names=new Set<string>();
  for(const [i,item] of manifest.documents.entries()){
   const v=record(item),expected="documents/"+String(i).padStart(5,"0")+".enc";
   if(!v||typeof v.sourceName!=="string"||!DOCUMENT.test(v.sourceName)||
    names.has(v.sourceName)||!component(v)||v.path!==expected||
    v.size>MAX_DOCUMENT||v.encryptedSize>MAX_DOCUMENT)
    invalid("document-metadata-invalid");
   names.add(v.sourceName);
   documents.push(v as unknown as {sourceName:string}&BackupComponent);
  }
  const expectedTop=new Set(["index.json","manifest.enc","database.pgcustom.enc"]);
  if(documents.length)expectedTop.add("documents");
  const top=await readdir(folder);
  if(top.length!==expectedTop.size||top.some(name=>!expectedTop.has(name)))
   invalid("package-components-unexpected");
  if(documents.length){
   const docsDir=join(folder,"documents");
   const dirInfo=await lstat(docsDir).catch(()=>incomplete("documents-directory-missing"));
   if(!dirInfo.isDirectory()||dirInfo.isSymbolicLink())invalid("documents-directory-invalid");
   const documentFiles=await readdir(docsDir);
   if(documentFiles.length<documents.length)incomplete("document-component-missing");
   if(documentFiles.length>documents.length||
    documentFiles.some(name=>!/^\d{5}\.enc$/.test(name)))invalid("documents-directory-unexpected");
  }
  await verifyEncrypted(join(folder,database.path),database,key,MAX_DATABASE,false);
  const metadata=new Map<string,Record<string,unknown>>();
  const contentHash=new Map<string,string>();
  for(const item of documents){
   const bytes=await verifyEncrypted(join(folder,item.path),item,key,MAX_DOCUMENT,
    item.sourceName.endsWith(".meta.json"));
   if(item.sourceName.endsWith(".meta.json")){
    let value:unknown;
    try{value=JSON.parse(bytes!.toString("utf8"));}catch{invalid("document-link-invalid");}
    finally{bytes!.fill(0);}
    const v=record(value);
    if(!v)invalid("document-link-invalid");
    metadata.set(item.sourceName,v);
   }else contentHash.set(item.sourceName,item.sha256);
  }
  for(const [name,v] of metadata){
   const id=name.slice(0,-".meta.json".length);
   if(v.id!==id||(v.format!=="TXT"&&v.format!=="PDF")||
    typeof v.teamId!=="string"||typeof v.userAuthorized!=="boolean"||
    typeof v.sha256!=="string"||!HASH.test(v.sha256)||
    v.sha256!==contentHash.get(id+(v.format==="TXT"?".txt":".pdf")))
    invalid("document-link-invalid");
  }
  if(metadata.size!==contentHash.size)invalid("document-link-invalid");
  const components=[database,...documents].map((item):VerifiedComponent=>({
   path:item.path,kind:item.path==="database.pgcustom.enc"?"database":"document",
   size:item.size,encryptedSize:item.encryptedSize,encryptedSha256:item.encryptedSha256
  }));
  return {id,createdAt,status:"verified",reason:null,checkedAt,
   installationSource:manifest.version===2?manifest.installationSource as string:"singleton (legacy)",
   applicationVersion:manifest.version===2?manifest.appVersion as string:null,
   schemaVersion:manifest.schemaVersion as number,postgresVersion:manifest.postgresVersion as string,
   components,documentCount:documents.length/2,integrityVerified:true,restoreTested:false};
 }catch(error){
  if(error instanceof VerificationProblem)
   return publicFailure(id,checkedAt,error.status,error.code,createdAt);
  return publicFailure(id,checkedAt,"invalid","verification-failed",createdAt);
 }
}

/** Persist only sanitized status evidence; these records are never used as proof. */
export async function backupInventory(root:string):Promise<BackupInventoryEntry[]>{
 const base=await lstat(root).catch(error=>{
  if(error&&typeof error==="object"&&"code" in error&&error.code==="ENOENT")return null;
  throw error;
 });
 if(!base)return [];
 await privateFolder(root);
 const packages=join(root,"packages");
 const dir=await lstat(packages).catch(error=>{
  if(error&&typeof error==="object"&&"code" in error&&error.code==="ENOENT")return null;
  throw error;
 });
 if(!dir)return [];
 if(!dir.isDirectory()||dir.isSymbolicLink())throw new Error("backup-packages-invalid");
 const names=(await readdir(packages)).filter(name=>UUID.test(name));
 if(names.length>200)throw new Error("backup-inventory-limit");
 let key:Buffer|null=null;
 try{
  const path=join(root,".backup-key");
  const info=await lstat(path).catch(()=>null);
  if(info?.isFile()&&!info.isSymbolicLink()){
   const bytes=await smallFile(path,32).catch(()=>null);
   if(bytes?.length===32)key=bytes;
  }
  const entries:BackupInventoryEntry[]=[];
  for(const name of names){
   const item=await inspectBackup(root,name,key);
   entries.push(item);
   // Recorded for audit of the last check, but never trusted on a subsequent GET.
   const folder=join(root,"verification");
   await privateFolder(folder,true);
   await safeAtomicJson(join(folder,name+".json"),{
    id:name,status:item.status,reason:item.reason,checkedAt:item.checkedAt,
    integrityVerified:item.integrityVerified,restoreTested:false
   });
  }
  return entries.sort((a,b)=>(b.createdAt??"").localeCompare(a.createdAt??""));
 }finally{key?.fill(0);}
}
