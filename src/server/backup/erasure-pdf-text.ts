import {spawn} from "node:child_process";
import {lstat} from "node:fs/promises";
import {isAbsolute} from "node:path";

export type BinaryExtraction=Readonly<{
 state:"extracted"|"unavailable"|"unreadable"|"image-only";
 text:string|null;reason:string;
}>;
/**
 * Poppler pdftotext, when explicitly configured and already available.
 * On Windows we do not install or download anything. Missing extraction is
 * a hard UNKNOWN in the impact preview, not an assertion of absence.
 */
export async function extractPdfText(bytes:Buffer):Promise<BinaryExtraction>{
 if(!Buffer.isBuffer(bytes)||bytes.length<32||bytes.length>20*1024*1024||
  bytes.subarray(0,5).toString("ascii")!=="%PDF-")
  return {state:"unreadable",text:null,reason:"invalid-pdf"};
 const executable=process.env.SMN_PDFTOTEXT_PATH;
 if(!executable||!isAbsolute(executable))
  return {state:"unavailable",text:null,reason:"extractor-not-configured"};
 const stats=await lstat(executable).catch(()=>null);
 if(!stats?.isFile()||stats.isSymbolicLink())
  return {state:"unavailable",text:null,reason:"extractor-unavailable"};
 try{
  const chunks:Buffer[]=[];let size=0;
  const result=await new Promise<{code:number|null;stdout:Buffer}>((resolve,reject)=>{
   const child=spawn(executable,["-enc","UTF-8","-nopgbrk","-","-"],{
    windowsHide:true,stdio:["pipe","pipe","ignore"],
    signal:AbortSignal.timeout(7000),
    env:{PATH:process.env.PATH??"",SystemRoot:process.env.SystemRoot??""}
   });
   child.once("error",reject);
   child.stdout.on("data",(chunk:Buffer)=>{
    size+=chunk.length;
    if(size>4*1024*1024){child.kill();reject(new Error("pdf-text-too-large"));}
    else chunks.push(chunk);
   });
   child.once("close",code=>resolve({code,stdout:Buffer.concat(chunks)}));
   child.stdin.on("error",()=>undefined);
   child.stdin.end(bytes);
  });
  if(result.code!==0)return {state:"unreadable",text:null,reason:"extractor-failed"};
  const text=new TextDecoder("utf-8",{fatal:true}).decode(result.stdout);
  if(!text.trim())return {state:"image-only",text:null,reason:"no-text-layer"};
  return {state:"extracted",text,reason:"pdf-text-layer"};
 }catch{return {state:"unreadable",text:null,reason:"extractor-failed"};}
}
