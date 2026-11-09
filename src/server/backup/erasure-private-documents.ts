import {readFile} from "node:fs/promises";
import {join} from "node:path";
import {privateFolder,scanDocuments} from "./files";
import type {TableImpact} from "./erasure-impact-graph";

/**
 * SMN-26 private TXT/PDF store: read-only scan.
 * Text matches are candidates only; PDFs must be assessed with a certified
 * parser or manually. Never send file bodies or file names to the browser.
 */
export async function inspectPrivateDocuments(
 root:string|undefined,terms:readonly string[],
 teams:ReadonlySet<string>
):Promise<TableImpact[]>{
 const unknown=(kind:string):TableImpact=>({
  table:kind,category:"private-files",scope:"team-archive",count:null,state:"unknown"
 });
 if(!root)return [unknown("private-txt"),unknown("private-pdf")];
 try{
  await privateFolder(root);
  const listed=await scanDocuments(root);
  if(listed.length>2000)throw new Error("document-inventory-too-large");
  const tokens=[...new Set(terms.map(s=>s.trim().toLocaleLowerCase("fr"))
   .filter(x=>x.length>=3&&x.length<=254))];
  let txtMatches=0,pdfCandidates=0;
  for(const file of listed.filter(v=>v.name.endsWith(".meta.json"))){
   const descriptor=JSON.parse((await readFile(join(root,file.name))).toString("utf8"))
    as {format?:unknown;teamId?:unknown};
   if(typeof descriptor.teamId!=="string"||!teams.has(descriptor.teamId))continue;
   if(descriptor.format==="PDF"){pdfCandidates++;continue;}
   if(descriptor.format!=="TXT")throw new Error("private-document-format-invalid");
   const base=file.name.slice(0,-".meta.json".length);
   const plain=(await readFile(join(root,base+".txt"))).toString("utf8").toLocaleLowerCase("fr");
   if(tokens.some(term=>plain.includes(term)))txtMatches++;
  }
  return [
   {table:"private-txt",category:"private-files",scope:"text-match",
    count:tokens.length?txtMatches:null,state:tokens.length?"inspected":"unknown"},
   {table:"private-pdf",category:"private-files",scope:"team-archive",
    count:pdfCandidates,state:"inspected"}
  ];
 }catch{
  // Missing or corrupt content must never be interpreted as zero impact.
  return [unknown("private-txt"),unknown("private-pdf")];
 }
}
