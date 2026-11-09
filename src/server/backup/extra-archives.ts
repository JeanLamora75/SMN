import {lstat,mkdir,readdir,readFile} from "node:fs/promises";
import {join,resolve} from "node:path";
import type {Client} from "pg";
import {sealedFile,sha,type BackupComponent} from "./files";
import {officeReportsDirectory} from "../reports/office-storage";
import {readVerifiedPdfArchive} from "../reports/pdf-archive-store";

export type ExtraFile=BackupComponent&{sourceName:string};
export type ExtraInventory={pdf:readonly {name:string;hash:string;size:number}[];
 office:readonly {name:string;hash:string;size:number}[]};
const PDF=/^[a-f0-9-]{36}\.pdf$/i;
const OFFICE=/^[^\\/:*?"<>|\x00-\x1f]{1,120}\.(?:docx|pptx)$/i;
const MAX=200,MAX_FILE=20*1024*1024,MAX_TOTAL=512*1024*1024;

export function pdfArchiveDirectory():string{
 return resolve(process.env.SMN_PRIVATE_REPORT_ARCHIVE_DIR||
  join(process.cwd(),".smn-private","report-archives"));
}
async function checkedDirectory(root:string){
 const stat=await lstat(root).catch((e:NodeJS.ErrnoException)=>{
  if(e.code==="ENOENT")return null;throw e;
 });
 if(!stat)return false;
 if(!stat.isDirectory()||stat.isSymbolicLink())throw Error("extra-archive-directory-invalid");
 return true;
}
async function safeBytes(root:string,name:string):Promise<Buffer>{
 const file=join(root,name),stat=await lstat(file);
 if(!stat.isFile()||stat.isSymbolicLink()||stat.size<1||stat.size>MAX_FILE)
  throw Error("extra-archive-file-invalid");
 const bytes=await readFile(file);
 if(bytes.length!==stat.size)throw Error("extra-archive-file-changed");
 return bytes;
}
async function pdfReferences(db:Pick<Client,"query">){
 const r=await db.query<{id:string;sha256:string;byte_length:number;stored_name:string}>(`
  SELECT id,sha256,byte_length,stored_name FROM public.smn_report_pdf_archive
  ORDER BY id LIMIT $1`,[MAX+1]);
 if(r.rows.length>MAX)throw Error("extra-archive-too-many");
 return r.rows;
}
/** DB reference + SHA verification, not merely directory listing. */
export async function inspectExtraArchives(db:Pick<Client,"query">):Promise<ExtraInventory>{
 const pdfRoot=pdfArchiveDirectory(),officeRoot=officeReportsDirectory();
 const [pdfExists,officeExists,refs]=await Promise.all([
  checkedDirectory(pdfRoot),checkedDirectory(officeRoot),pdfReferences(db)
 ]);
 if(refs.length&&!pdfExists)throw Error("extra-archive-pdf-directory-missing");
 const pdfNames=pdfExists?await readdir(pdfRoot):[];
 if(pdfNames.some(n=>!PDF.test(n))||pdfNames.length!==refs.length)
  throw Error("extra-archive-pdf-orphan-or-missing");
 const pdf:ExtraInventory["pdf"][number][]=[];
 let total=0;
 for(const r of refs){
  if(!PDF.test(r.stored_name)||r.stored_name!==r.id+".pdf"||
   !pdfNames.includes(r.stored_name))throw Error("extra-archive-pdf-mismatch");
  const bytes=await safeBytes(pdfRoot,r.stored_name);
  const hash=sha(bytes);
  if(hash!==r.sha256||bytes.length!==r.byte_length)
   throw Error("extra-archive-pdf-integrity");
  total+=bytes.length;if(total>MAX_TOTAL)throw Error("extra-archive-too-large");
  pdf.push({name:r.stored_name,hash,size:bytes.length});
 }
 const officeNames=officeExists?(await readdir(officeRoot)).sort():[];
 if(officeNames.length>MAX||officeNames.some(n=>!OFFICE.test(n)))
  throw Error("extra-archive-office-unrecognized");
 const office:ExtraInventory["office"][number][]=[];
 for(const name of officeNames){
  const bytes=await safeBytes(officeRoot,name);
  total+=bytes.length;if(total>MAX_TOTAL)throw Error("extra-archive-too-large");
  office.push({name,hash:sha(bytes),size:bytes.length});
 }
 return {pdf,office};
}
export async function encryptExtraArchives(inventory:ExtraInventory,key:Buffer,
 staging:string):Promise<{pdf:ExtraFile[];office:ExtraFile[]}>{
 const result:{pdf:ExtraFile[];office:ExtraFile[]}={pdf:[],office:[]};
 for(const kind of ["pdf","office"] as const){
  const files=inventory[kind];
  if(!files.length)continue;
  const folder=kind==="pdf"?"report-pdfs":"office-reports";
  const root=kind==="pdf"?pdfArchiveDirectory():officeReportsDirectory();
  await mkdir(join(staging,folder),{mode:0o700});
  for(const [index,file] of files.entries()){
   const bytes=await safeBytes(root,file.name);
   if(bytes.length!==file.size||sha(bytes)!==file.hash)
    throw Error("extra-archive-changed");
   const name=String(index).padStart(5,"0")+".enc",path=folder+"/"+name;
   result[kind].push({sourceName:file.name,...await sealedFile(key,bytes,
    join(staging,path),path)});
  }
 }
 return result;
}
export function validExtraName(kind:"pdf"|"office",name:string){
 return (kind==="pdf"?PDF:OFFICE).test(name)&&name!=="."&&name!=="..";
}
