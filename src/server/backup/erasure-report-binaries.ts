import "server-only";
import {createHash} from "node:crypto";
import {lstat,readdir,readFile} from "node:fs/promises";
import {join} from "node:path";
import type {Client} from "pg";
import type {TableImpact} from "./erasure-impact-graph";
import {readVerifiedPdfArchive} from "../reports/pdf-archive-store";
import {officeReportsDirectory} from "../reports/office-storage";
import {extractPdfText} from "./erasure-pdf-text";
import {extractOoxmlText} from "./erasure-ooxml-text";

const LIMIT=40;
const row=(table:string,count:number|null,
 state:"inspected"|"unknown"):TableImpact=>({
  table,category:"archived-pdf-txt",scope:"text-match",count,state
 });
const matches=(text:string,terms:readonly string[])=>{
 const lowered=text.toLocaleLowerCase("fr");
 return terms.some(term=>lowered.includes(term));
};
/**
 * Archived PDFs are read through SMN's official integrity-verifying store,
 * not by joining arbitrary paths from database records.
 */
export async function inspectVerifiedPdfArchiveText(db:Client,
 teams:readonly string[],terms:readonly string[]):Promise<TableImpact>{
 if(!teams.length)return row("report-pdf-text-matches",0,"inspected");
 try{
  const result=await db.query<{id:string}>(`
   SELECT id FROM public.smn_report_pdf_archive
   WHERE team_id=ANY($1::text[]) ORDER BY id LIMIT $2`,[teams,LIMIT+1]);
  if(result.rows.length>LIMIT)return row("report-pdf-text-matches",null,"unknown");
  if(!result.rows.length)return row("report-pdf-text-matches",0,"inspected");
  if(!terms.length)return row("report-pdf-text-matches",null,"unknown");
  let matched=0;
  for(const item of result.rows){
   const bytes=await readVerifiedPdfArchive(db,item.id);
   if(!bytes)return row("report-pdf-text-matches",null,"unknown");
   const result=await extractPdfText(bytes);
   if(result.state!=="extracted"||!result.text)
    return row("report-pdf-text-matches",null,"unknown");
   if(matches(result.text,terms))matched++;
  }
  return row("report-pdf-text-matches",matched,"inspected");
 }catch{return row("report-pdf-text-matches",null,"unknown");}
}

/** Database TXT archives: SHA check before searching and no personal text in response. */
export async function inspectAiBriefText(db:Client,teams:readonly string[],
 terms:readonly string[]):Promise<TableImpact>{
 if(!teams.length)return row("ai-brief-text-matches",0,"inspected");
 try{
  const result=await db.query<{content:Buffer;sha256:string;byte_length:number}>(`
   SELECT content,sha256,byte_length FROM public.smn_ai_brief_archive
   WHERE team_id=ANY($1::text[]) ORDER BY id LIMIT $2`,[teams,LIMIT+1]);
  if(result.rows.length>LIMIT||!terms.length)return row("ai-brief-text-matches",null,"unknown");
  let count=0;
  for(const item of result.rows){
   if(!Buffer.isBuffer(item.content)||item.content.length>200_000||
    item.content.length!==item.byte_length||
    createHash("sha256").update(item.content).digest("hex")!==item.sha256)
    return row("ai-brief-text-matches",null,"unknown");
   const value=new TextDecoder("utf-8",{fatal:true}).decode(item.content);
   if(matches(value,terms))count++;
  }
  return row("ai-brief-text-matches",count,"inspected");
 }catch{return row("ai-brief-text-matches",null,"unknown");}
}

/**
 * The Office reports folder can contain copied/exported reports not linked by
 * a database key. All are candidates; missing folder means no files *there*,
 * not a guarantee about external copies.
 */
export async function inspectOfficeReportText(terms:readonly string[]):Promise<readonly TableImpact[]>{
 const fail=()=>[
  {table:"office-reports-candidates",category:"archived-pdf-txt",
   scope:"team-archive",count:null,state:"unknown"},
  row("office-text-matches",null,"unknown")
 ] as readonly TableImpact[];
 try{
  const root=officeReportsDirectory();
  const stat=await lstat(root).catch((error:NodeJS.ErrnoException)=>{
   if(error.code==="ENOENT")return null;
   throw error;
  });
  if(stat===null)return [
   {table:"office-reports-candidates",category:"archived-pdf-txt",
    scope:"team-archive",count:0,state:"inspected"} as const,
   row("office-text-matches",0,"inspected")
  ];
  if(!stat.isDirectory()||stat.isSymbolicLink())return fail();
  const files=(await readdir(root)).filter(name=>/\.(?:docx|pptx)$/i.test(name));
  if(files.length>LIMIT)return fail();
  let matched=0;
  let inspectable=terms.length>0;
  for(const name of files){
   const path=join(root,name);
   const metadata=await lstat(path);
   if(!metadata.isFile()||metadata.isSymbolicLink()||metadata.size>20*1024*1024||
    metadata.size<=0){inspectable=false;continue;}
   const inspected=extractOoxmlText(await readFile(path));
   if(inspected.state!=="extracted"||!inspected.text){inspectable=false;continue;}
   if(matches(inspected.text,terms))matched++;
   // Images/embedded files can contain additional personal data; the match
   // is a positive candidate and must never be interpreted as a negative proof.
  }
  return [
   {table:"office-reports-candidates",category:"archived-pdf-txt",
    scope:"team-archive",count:files.length,state:"inspected"} as const,
   row("office-text-matches",inspectable?matched:null,
    inspectable?"inspected":"unknown")
  ];
 }catch{return fail();}
}
