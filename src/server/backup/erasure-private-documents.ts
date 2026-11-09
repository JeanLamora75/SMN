import {readFile} from "node:fs/promises";
import {join} from "node:path";
import {privateFolder,scanDocuments} from "./files";
import {extractPdfText} from "./erasure-pdf-text";
import type {TableImpact} from "./erasure-impact-graph";

const LIMIT=12;
const row=(table:string,count:number|null,state:"inspected"|"unknown",
 scope:"text-match"|"team-archive"):TableImpact=>({
 table,category:"private-files",scope,count,state
});
/**
 * SMN-26 private store. Every PDF/TXT and companion manifest is integrity
 * checked by scanDocuments first. No content or file identifier is returned.
 */
export async function inspectPrivateDocuments(
 root:string|undefined,terms:readonly string[],
 teams:ReadonlySet<string>
):Promise<TableImpact[]>{
 const unknown=()=>[
  row("private-txt-matches",null,"unknown","text-match"),
  row("private-pdf-candidates",null,"unknown","team-archive"),
  row("private-pdf-text-matches",null,"unknown","text-match")
 ];
 if(!root)return unknown();
 try{
  await privateFolder(root);
  const listed=await scanDocuments(root);
  if(listed.length>2000)return unknown();
  const tokens=[...new Set(terms.map(s=>s.trim().toLocaleLowerCase("fr"))
   .filter(x=>x.length>=3&&x.length<=254))];
  let txtMatches=0,pdfCandidates=0,pdfMatches=0;
  let allPdfExtracted=tokens.length>0&&!!process.env.SMN_PDFTOTEXT_PATH;
  for(const file of listed.filter(v=>v.name.endsWith(".meta.json"))){
   const descriptor=JSON.parse((await readFile(join(root,file.name))).toString("utf8")) as {format?:unknown;teamId?:unknown};
   if(typeof descriptor.teamId!=="string"||!teams.has(descriptor.teamId))continue;
   const stem=file.name.slice(0,-".meta.json".length);
   if(descriptor.format==="TXT"){
    if(tokens.length){
     const content=(await readFile(join(root,stem+".txt"))).toString("utf8").toLocaleLowerCase("fr");
     if(tokens.some(term=>content.includes(term)))txtMatches++;
    }
    continue;
   }
   if(descriptor.format!=="PDF")return unknown();
   pdfCandidates++;
   if(pdfCandidates>LIMIT){allPdfExtracted=false;continue;}
   if(!tokens.length||!process.env.SMN_PDFTOTEXT_PATH){allPdfExtracted=false;continue;}
   const bytes=await readFile(join(root,stem+".pdf"));
   const extracted=await extractPdfText(bytes);
   if(extracted.state!=="extracted"||!extracted.text){
    allPdfExtracted=false;continue;
   }
   const body=extracted.text.toLocaleLowerCase("fr");
   if(tokens.some(term=>body.includes(term)))pdfMatches++;
  }
  return [
   row("private-txt-matches",tokens.length?txtMatches:null,
    tokens.length?"inspected":"unknown","text-match"),
   row("private-pdf-candidates",pdfCandidates,"inspected","team-archive"),
   row("private-pdf-text-matches",allPdfExtracted?pdfMatches:null,
    allPdfExtracted?"inspected":"unknown","text-match")
  ];
 }catch{return unknown();}
}
