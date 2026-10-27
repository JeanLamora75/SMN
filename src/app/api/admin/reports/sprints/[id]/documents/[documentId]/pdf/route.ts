import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {inspectPdfEligibility} from "@/server/reports/studio-export";
import {renderStudioPdf} from "@/server/reports/studio-pdf-render";
import {storeFinalPdfArchive} from "@/server/reports/pdf-archive-store";
import {jsonResult} from "@/server/auth/request";
import {getReportDocument} from "@/server/reports/report-documents";
import {studioArchiveReference} from "@/server/reports/studio-archive-reference";
export const dynamic="force-dynamic";export const runtime="nodejs";
type P={params:Promise<{id:string;documentId:string}>};
async function execute(req:NextRequest,{params}:P,archive:boolean){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {id,documentId}=await params;
 const expected=Number(req.headers.get("x-smn-expected-revision"));
 if(!Number.isSafeInteger(expected)||expected<1)return jsonResult({error:"expected-revision-required"},400);
 if(!/^[a-f0-9-]{36}$/i.test(id)||!/^[a-f0-9-]{36}$/i.test(documentId))return jsonResult({error:"invalid-input"},400);
 try{
 const result=await withLegacyTeamApi(async db=>{
  const eligible=await inspectPdfEligibility(db,id,documentId);
  if(!eligible)return {error:"not-found"} as const;
  if(eligible.document.revision!==expected)return {error:"revision-changed"} as const;
  if(!eligible.exportable)return {error:"quality-blocked",issues:eligible.errors} as const;
  if(eligible.warnings.length>0&&req.headers.get("x-smn-ack-warnings")!=="true")
   return {error:"warnings-require-confirmation",issues:eligible.warnings} as const;
  const bytes=await renderStudioPdf(eligible.document);
  // Reject a render that became stale while Chromium was producing the PDF.
  const latest=await getReportDocument(db,id,documentId);
  if(!latest||latest.revision!==expected)return {error:"revision-changed"} as const;
  if(!archive)return {bytes} as const;
  const doc=eligible.document;
  const inputReference=studioArchiveReference(doc);
  const manifest=await storeFinalPdfArchive(db,bytes,{authorId:actor.id,language:doc.language,templateId:doc.templateId,teamId:doc.teamId,cycleId:doc.sprintId,cycleStatus:"draft",snapshotVersion:null,templateName:doc.title,optionsSnapshot:{studioDocumentId:inputReference.documentId,studioDocumentRevision:inputReference.documentRevision,studioSourceSha256:inputReference.sourceSha256}},undefined,doc);
  return {manifest} as const;
 });
 if("error" in result)return jsonResult(result,result.error==="not-found"?404:result.error==="quality-blocked"?422:409);
 if("bytes" in result){
  // The union can expose an optional bytes property; never build a PDF response without data.
  if(result.bytes===undefined)return jsonResult({error:"pdf-render-unavailable"},503);
  return new Response(new Uint8Array(result.bytes),{headers:{
   "Content-Type":"application/pdf",
   "Content-Disposition":'attachment; filename="SMN-report.pdf"',
   "Cache-Control":"private, no-store",
   "X-Content-Type-Options":"nosniff"
  }});
 }
 return jsonResult({ok:true,archiveId:result.manifest.id,version:result.manifest.optionsSnapshot?.studioArchiveVersion},201);
 }catch{return jsonResult({error:"pdf-render-unavailable"},503);}
}
export async function POST(req:NextRequest,ctx:P){return execute(req,ctx,false);}
export async function PUT(req:NextRequest,ctx:P){return execute(req,ctx,true);}
