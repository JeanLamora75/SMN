import {createHash} from "node:crypto";
import {lstat,readFile,readdir,realpath} from "node:fs/promises";
import path from "node:path";
import {inflateRawSync} from "node:zlib";

export type OfficeTemplate={
 id:string;
 name:string;
 format:"docx"|"pptx";
 filename:string;
};
const MAX_FILE_BYTES=20*1024*1024;
const MAX_ENTRIES=500;
const MAX_UNCOMPRESSED_BYTES=60*1024*1024;

function safeFilename(name:string):boolean{
 return name.length>0&&name.length<=220&&
  !name.startsWith(".")&&!name.startsWith("~$")&&
  !/[\\/\x00-\x1f<>:"|?*]/.test(name)&&
  /\.(docx|pptx)$/i.test(name);
}

export function officeTemplatesDirectory(env:NodeJS.ProcessEnv=process.env):string{
 const configured=env.SMN_OFFICE_TEMPLATES_DIR?.trim();
 if(configured){
  if(!path.isAbsolute(configured))throw Error("office-template-directory-not-absolute");
  return path.resolve(configured);
 }
 const base=env.LOCALAPPDATA?.trim()||path.join(process.cwd(),".smn-local");
 return path.join(base,"ScrumMasterNotebook","office-templates");
}

/** Inspect the ZIP directory without extracting or trusting an extension alone. */
export function isSupportedOfficePackage(buffer:Buffer,format:"docx"|"pptx"):boolean{
 if(buffer.length<22||buffer.length>MAX_FILE_BYTES)return false;
 let eocd=-1;
 for(let i=buffer.length-22;i>=Math.max(0,buffer.length-65557);i--){
  if(buffer.readUInt32LE(i)===0x06054b50 &&
   i+22+buffer.readUInt16LE(i+20)===buffer.length){eocd=i;break;}
 }
 if(eocd<0)return false;
 const disk=buffer.readUInt16LE(eocd+4),centralDisk=buffer.readUInt16LE(eocd+6);
 const diskCount=buffer.readUInt16LE(eocd+8),count=buffer.readUInt16LE(eocd+10);
 const centralSize=buffer.readUInt32LE(eocd+12),start=buffer.readUInt32LE(eocd+16);
 if(disk!==0||centralDisk!==0||diskCount!==count||count===0||count>MAX_ENTRIES||
  centralSize===0xffffffff||start===0xffffffff||start+centralSize>eocd)return false;
 let offset=start,total=0;
 const names=new Set<string>();
 const manifests=new Map<string,string>();
 for(let index=0;index<count;index++){
  if(offset+46>buffer.length||buffer.readUInt32LE(offset)!==0x02014b50)return false;
  const flags=buffer.readUInt16LE(offset+8),method=buffer.readUInt16LE(offset+10);
  const packed=buffer.readUInt32LE(offset+20),unpacked=buffer.readUInt32LE(offset+24);
  const nameLen=buffer.readUInt16LE(offset+28),extraLen=buffer.readUInt16LE(offset+30);
  const commentLen=buffer.readUInt16LE(offset+32),local=buffer.readUInt32LE(offset+42);
  const end=offset+46+nameLen+extraLen+commentLen;
  if(end>buffer.length||nameLen===0||(flags&1)!==0||
   ![0,8].includes(method)||packed===0xffffffff||unpacked===0xffffffff||
   local+30>buffer.length||buffer.readUInt32LE(local)!==0x04034b50)return false;
  const name=buffer.subarray(offset+46,offset+46+nameLen).toString("utf8");
  if(name.startsWith("/")||name.includes("\\")||name.includes("\x00")||
   name.split("/").includes("..")||names.has(name))return false;
  names.add(name);
  const localNameLen=buffer.readUInt16LE(local+26),localExtraLen=buffer.readUInt16LE(local+28);
  const dataStart=local+30+localNameLen+localExtraLen;
  if(dataStart+packed>start||localNameLen!==nameLen||
   buffer.subarray(local+30,local+30+nameLen).toString("utf8")!==name)return false;
  total+=unpacked;
  if(total>MAX_UNCOMPRESSED_BYTES||(packed===0&&unpacked>0)||
   (packed>0&&unpacked>packed*100))return false;
  if(name==="[Content_Types].xml"||name==="_rels/.rels"){
   if(unpacked>1024*1024)return false;
   const chunk=buffer.subarray(dataStart,dataStart+packed);
   let xml:string;
   try{xml=(method===0?chunk:inflateRawSync(chunk,{maxOutputLength:1024*1024})).toString("utf8");}
   catch{return false;}
   if(xml.length<10||!xml.includes("<"))return false;
   manifests.set(name,xml);
  }
  offset=end;
 }
 if(offset!==start+centralSize)return false;
 const document=format==="docx"?"word/document.xml":"ppt/presentation.xml";
 const mime=format==="docx"?"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml":
  "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml";
 return names.has(document)&&
  (manifests.get("[Content_Types].xml")||"").includes(mime)&&
  (manifests.get("_rels/.rels")||"").includes("/officeDocument");
}
export function templateIdentifier(filename:string):string{
 return createHash("sha256").update(filename,"utf8").digest("hex").slice(0,32);
}

export async function listOfficeTemplates(directory=officeTemplatesDirectory()):Promise<OfficeTemplate[]>{
 // A missing folder is an empty catalog, not a reason to create database rows.
 let rootStat;
 try{rootStat=await lstat(directory);}catch(error){
  if((error as NodeJS.ErrnoException).code==="ENOENT")return [];
  throw error;
 }
 if(!rootStat.isDirectory()||rootStat.isSymbolicLink())throw Error("office-template-directory-invalid");
 const root=await realpath(directory);
 const candidates=await readdir(root,{withFileTypes:true});
 const templates:OfficeTemplate[]=[];
 for(const entry of candidates){
  if(!entry.isFile()||entry.isSymbolicLink()||!safeFilename(entry.name))continue;
  const format=entry.name.toLowerCase().endsWith(".docx")?"docx":"pptx";
  const full=path.join(root,entry.name);
  try{
   const stat=await lstat(full);
   if(!stat.isFile()||stat.isSymbolicLink()||stat.size<22||stat.size>MAX_FILE_BYTES)continue;
   const canonical=await realpath(full);
   if(path.dirname(canonical)!==root)continue;
   const bytes=await readFile(canonical);
   if(bytes.length!==stat.size||!isSupportedOfficePackage(bytes,format))continue;
   templates.push({
    id:templateIdentifier(entry.name),
    name:entry.name.slice(0,-5),
    filename:entry.name,
    format
   });
  }catch(error){
   // A removed, unreadable or malformed candidate cannot block valid models.
   if((error as NodeJS.ErrnoException).code==="ENOENT"||
      (error as NodeJS.ErrnoException).code==="EACCES"||
      (error as NodeJS.ErrnoException).code==="EPERM")continue;
   throw error;
  }
 }
 return templates.sort((a,b)=>a.filename.localeCompare(b.filename,"fr",{sensitivity:"base"}));
}

/** Revalidate the selected model at use time; never trust client-provided filenames or paths. */
export async function readOfficeTemplateById(id:string,directory=officeTemplatesDirectory()):
 Promise<{template:OfficeTemplate;bytes:Buffer}|null>{
 if(!/^[0-9a-f]{32}$/.test(id))return null;
 const models=await listOfficeTemplates(directory);
 const template=models.find(item=>item.id===id);
 if(!template)return null;
 const root=await realpath(directory);
 const filename=path.join(root,template.filename);
 const stat=await lstat(filename);
 if(!stat.isFile()||stat.isSymbolicLink()||stat.size>MAX_FILE_BYTES)return null;
 if(path.dirname(await realpath(filename))!==root)return null;
 const bytes=await readFile(filename);
 if(!isSupportedOfficePackage(bytes,template.format))return null;
 return {template,bytes};
}
