import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {inspectPdfEligibility} from "@/server/reports/studio-export";
import {renderStudioPdf} from "@/server/reports/studio-pdf-render";
import {storeFinalPdfArchive} from "@/server/reports/pdf-archive-store";
import {jsonResult} from "@/server/auth/request";
export const dynamic="force-dynamic";export const runtime="nodejs";
type P={params:Promise<{id:string;documentId:string}>};
async function execute(req:NextRequest,{params}:P,archive:boolean){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {id,documentId}=await params;
 if(!/^[a-f0-9-]{36}$/i.test(id)||!/^[a-f0-9-]{36}$/i.test(documentId))return jsonResult({error:"invalid-input"},400);
 try{
 const result=await withAuthDb(async db=>{
  const eligible=await inspectPdfEligibility(db,id,documentId);
  if(!eligible)return {error:"not-found"} as const;
  if(!eligible.exportable)return {error:"quality-blocked",issues:eligible.errors} as const;
  if(eligible.warnings.length>0&&req.headers.get("x-smn-ack-warnings")!=="true")
   return {error:"warnings-require-confirmation",issues:eligible.warnings} as const;
  const bytes=await renderStudioPdf(eligible.document);
  if(!archive)return {bytes} as const;
  const doc=eligible.document;
  const manifest=await storeFinalPdfArchive(db,bytes,{authorId:actor.id,language:doc.language,templateId:doc.templateId,teamId:doc.teamId,cycleId:doc.sprintId,cycleStatus:"draft",snapshotVersion:null,templateName:doc.title});
  return {manifest} as const;
 });
 if("error" in result)return jsonResult(result,result.error==="not-found"?404:result.error==="quality-blocked"?422:409);
 if("bytes" in result)return new Response(new Uint8Array(result.bytes),{headers:{"Content-Type":"application/pdf","Content-Disposition":'attachment; filename="SMN-report.pdf"',"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
 return jsonResult({ok:true,archiveId:result.manifest.id},201);
 }catch{return jsonResult({error:"pdf-render-unavailable"},503);}
}
export async function POST(req:NextRequest,ctx:P){return execute(req,ctx,false);}
export async function PUT(req:NextRequest,ctx:P){return execute(req,ctx,true);}
