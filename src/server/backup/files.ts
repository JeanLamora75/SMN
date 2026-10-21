import {createHash,randomBytes} from "node:crypto";
import {lstat,mkdir,readFile,readdir,rename,rm,writeFile} from "node:fs/promises";
import {isAbsolute,join,relative,resolve,sep} from "node:path";
import {seal,type RecoveryEnvelope} from "./crypto";

export const sha=(x:Buffer)=>createHash("sha256").update(x).digest("hex");
export type BackupComponent=Readonly<{
 path:string;sha256:string;size:number;encryptedSha256:string;encryptedSize:number;nonce:string;tag:string;
}>;
export type SourceDocument=Readonly<{name:string;hash:string;length:number}>;

export function outsideApp(root:string):boolean{
 if(!isAbsolute(root))return false;
 const difference=relative(resolve(process.cwd()),resolve(root));
 return difference!==""
  &&(difference===".."||difference.startsWith(".."+sep)||isAbsolute(difference));
}
export async function privateFolder(dir:string,create=false):Promise<void>{
 if(!outsideApp(dir))throw new Error("backup-private-directory-invalid");
 if(create)await mkdir(dir,{recursive:true,mode:0o700});
 const info=await lstat(dir);
 if(!info.isDirectory()||info.isSymbolicLink())throw new Error("backup-private-directory-invalid");
}
export async function sealedFile(key:Buffer,bytes:Buffer,target:string,path:string):Promise<BackupComponent>{
 const encrypted=seal(key,bytes);
 await writeFile(target,encrypted.ciphertext,{flag:"wx",mode:0o600});
 return {path,sha256:sha(bytes),size:bytes.length,encryptedSha256:sha(encrypted.ciphertext),
  encryptedSize:encrypted.ciphertext.length,nonce:encrypted.nonce,tag:encrypted.tag};
}
const docId=(s:string)=>/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(s);
/** Refuse un document partiel/orphelin et toute entrée inconnue dans la collection privée. */
export async function scanDocuments(root:string|undefined):Promise<SourceDocument[]>{
 if(!root)return [];
 await privateFolder(root);
 const names=(await readdir(root)).sort();
 const documents:SourceDocument[]=[];
 const found=new Map<string,string>();
 for(const name of names){
  const info=await lstat(join(root,name));
  if(!info.isFile()||info.isSymbolicLink()||info.size<1||info.size>12*1024*1024)
   throw new Error("backup-document-invalid");
  if(!(name.endsWith(".meta.json")||name.endsWith(".txt")||name.endsWith(".pdf")))
   throw new Error("backup-document-unrecognized");
  const base=name.endsWith(".meta.json")?name.slice(0,-10):name.slice(0,-4);
  if(!docId(base))throw new Error("backup-document-name-invalid");
  const bytes=await readFile(join(root,name));
  if(bytes.length!==info.size)throw new Error("backup-document-changed");
  documents.push({name,hash:sha(bytes),length:bytes.length});
  found.set(name,base);
 }
 for(const item of documents.filter(x=>x.name.endsWith(".meta.json"))){
  const id=found.get(item.name)!;
  let manifest:unknown;
  try{manifest=JSON.parse((await readFile(join(root,item.name))).toString("utf8"));}
  catch{throw new Error("backup-document-manifest-invalid");}
  const v=manifest as Record<string,unknown>;
  if(!v||v.id!==id||(v.format!=="TXT"&&v.format!=="PDF")||
   typeof v.userAuthorized!=="boolean"||typeof v.teamId!=="string"||!docId(v.teamId)||
   typeof v.sha256!=="string"||!/^[0-9a-f]{64}$/.test(v.sha256))
   throw new Error("backup-document-manifest-invalid");
  const file=id+(v.format==="TXT"?".txt":".pdf");
  const body=documents.find(x=>x.name===file);
  if(!body||body.hash!==v.sha256)throw new Error("backup-document-inconsistent");
 }
 for(const file of documents.filter(x=>!x.name.endsWith(".meta.json"))){
  if(!found.has(found.get(file.name)!+".meta.json"))throw new Error("backup-document-orphan");
 }
 return documents;
}
export async function encryptDocuments(root:string|undefined,inventory:readonly SourceDocument[],
 destination:string,key:Buffer):Promise<BackupComponent[]>{
 const items:BackupComponent[]=[];
 if(inventory.length===0)return items;
 if(!root)throw new Error("backup-document-root-missing");
 await mkdir(destination,{mode:0o700});
 for(const [i,file] of inventory.entries()){
  const bytes=await readFile(join(root,file.name));
  if(bytes.length!==file.length||sha(bytes)!==file.hash)
   throw new Error("backup-document-changed");
  items.push(await sealedFile(key,bytes,join(destination,String(i).padStart(5,"0")+".enc"),
   "documents/"+String(i).padStart(5,"0")+".enc"));
 }
 return items;
}
export async function safeAtomicJson(path:string,value:unknown):Promise<void>{
 const pending=path+".tmp-"+randomBytes(6).toString("hex");
 try{
  await writeFile(pending,JSON.stringify(value),{mode:0o600,flag:"wx"});
  await rename(pending,path);
 }finally{await rm(pending,{force:true}).catch(()=>undefined);}
}
export type PublicBackupResult=Readonly<{id:string;createdAt:string;status:"success";documentCount:number}>;
export type BackupIndex=Readonly<{
 version:1;id:string;createdAt:string;encryptedManifest:Omit<BackupComponent,"path">;
 recovery:RecoveryEnvelope;
}>;
