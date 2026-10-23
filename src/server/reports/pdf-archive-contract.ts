import {createHash,randomUUID} from "node:crypto";
export const PDF_MAX_BYTES=20*1024*1024;
export type PdfArchiveManifest={id:string;sha256:string;byteLength:number;createdAt:string;authorId:string;language:"fr"|"en";templateId:string;teamId:string;cycleId:string;cycleStatus:string;snapshotVersion:number|null};
export function validateFinalPdf(bytes:Buffer):{sha256:string;byteLength:number}|null{
 if(bytes.length<32||bytes.length>PDF_MAX_BYTES||bytes.subarray(0,5).toString("ascii")!=="%PDF-")return null;
 const tail=bytes.subarray(Math.max(0,bytes.length-2048)).toString("latin1");
 if(!tail.includes("%%EOF"))return null;
 return {sha256:createHash("sha256").update(bytes).digest("hex"),byteLength:bytes.length};
}
export function newPdfManifest(bytes:Buffer,meta:Omit<PdfArchiveManifest,"id"|"sha256"|"byteLength"|"createdAt">):PdfArchiveManifest{
 const verified=validateFinalPdf(bytes);if(!verified)throw Error("invalid-pdf");
 return {...meta,...verified,id:randomUUID(),createdAt:new Date().toISOString()};
}
