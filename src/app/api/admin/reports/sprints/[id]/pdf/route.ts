import {NextRequest} from "next/server";
import {withAuthDb} from "@/server/auth/database";
import {assertTeamReportCycle} from "@/server/reports/team-cycle";
import {authorizeApi} from "@/server/auth/authorization";
import {SESSION_COOKIE} from "@/server/auth/guards";
import {withLegacyReportReadDb} from "@/server/reports/legacy-read";
import {readFrozenReportReference} from "@/server/reports/render-reference";
import {generateFrozenPdf} from "@/server/reports/frozen-pdf";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {storeFinalPdfArchive,readVerifiedPdfArchive} from "@/server/reports/pdf-archive-store";
import {validExportOperationId} from "@/server/reports/export-outcome";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"generate",{type:"documents",exists:true,inScope:true,collection:true});
 if(!actor)return Response.json({error:"forbidden"},{status:403});
 const {id}=await params;
 if(!/^[a-f0-9-]{36}$/i.test(id))return Response.json({error:"invalid-input"},{status:400});
 const body=await req.json().catch(()=>null) as {reference?:unknown}|null;
 if(!body||typeof body.reference!=="string"||!/^[a-f0-9-]{36}$/i.test(body.reference))return Response.json({error:"invalid-input"},{status:400});
 const referenceId=body.reference;
 const operationId=req.headers.get("x-smn-export-operation");
 if(!validExportOperationId(operationId))return Response.json({error:"operation-id-required"},{status:400});
 const cookie=req.cookies.get(SESSION_COOKIE)?.value;
 if(!cookie)return Response.json({error:"forbidden"},{status:403});
 const teamId=req.nextUrl.searchParams.get("teamId");
 if(teamId&&actor.role!=="admin")return Response.json({error:"forbidden"},{status:403});
 // The internal preview independently checks the session, active team, Sprint and signed-content hash.
 const reference=await (teamId?withAuthDb(async db=>{
  if(!await assertTeamReportCycle(db,{accountId:actor.id,role:actor.role},teamId,id))return null;
  return readFrozenReportReference(db,referenceId,id,teamId??undefined);
 }):withLegacyReportReadDb(db=>readFrozenReportReference(db,referenceId,id,teamId??undefined))).catch(()=>null);
 if(!reference)return Response.json({error:"reference-unavailable"},{status:409});
 const configured=process.env.SMN_PDF_INTERNAL_ORIGIN??"http://127.0.0.1:3003";
 let origin:URL;
 try{origin=new URL(configured);
 if(origin.protocol!=="http:"||!["127.0.0.1","localhost"].includes(origin.hostname)||origin.username||origin.password||origin.pathname!=="/")throw Error();}
 catch{return Response.json({error:"pdf-origin-invalid"},{status:503});}
 const url=new URL("/app/admin/sprints/"+id+"/report/preview",origin);
 url.searchParams.set("reference",reference.id);
 if(teamId)url.searchParams.set("teamId",teamId);
try{
 const run=async (db:import("pg").Client)=>{
  if(teamId&&!await assertTeamReportCycle(db,{accountId:actor.id,role:actor.role},teamId,id))throw Error("archive-scope-unavailable");
  const currentRef=await readFrozenReportReference(db,referenceId,id,teamId??undefined);
  if(!currentRef||currentRef.sha256!==reference.sha256)throw Error("reference-unavailable");
  // Session-level lock spans the browser render and DB commit.
  await db.query("SELECT pg_advisory_lock(hashtextextended($1::text,0))",[operationId]);
  try{
   const exists=await db.query<{present:boolean}>("SELECT to_regclass('public.smn_report_pdf_archive') IS NOT NULL AS present");
   if(exists.rows[0]?.present){
    const column=await db.query<{present:boolean}>(`SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='smn_report_pdf_archive' AND column_name='operation_id') AS present`);
    if(column.rows[0]?.present){
     const old=await db.query<{id:string;manifest:{renderReferenceId?:string;cycleId?:string;authorId?:string;teamId?:string}}>(`SELECT id,manifest FROM public.smn_report_pdf_archive WHERE operation_id=$1`,[operationId]);
     if(old.rows[0]){
      const archived=old.rows[0];
      if(archived.manifest.renderReferenceId!==reference.id||archived.manifest.cycleId!==id||archived.manifest.authorId!==actor.id||(teamId&&archived.manifest.teamId!==teamId))throw Error("retry-conflict");
      const same=await readVerifiedPdfArchive(db,archived.id);
      if(!same)throw Error("archive-integrity-failed");
      return {bytes:same,archiveId:archived.id};
     }
    }
   }
   const bytes=await generateFrozenPdf(url.toString(),{name:SESSION_COOKIE,value:cookie});
   const report=reference.payload.data;
   const scope=await db.query<{teamId:string}>(`SELECT s.team_id AS "teamId" FROM public.smn_sprint s
   JOIN public.smn_team t ON t.id=s.team_id JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE s.id=$1 AND s.deleted_at IS NULL AND i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum'`,[id]);
   if(scope.rows.length!==1||(teamId&&scope.rows[0].teamId!==teamId))throw Error("archive-scope-unavailable");
   const refreshed=await readFrozenReportReference(db,referenceId,id,teamId??undefined);
   if(!refreshed||refreshed.sha256!==reference.sha256)throw Error("reference-unavailable");
   const archived=await storeFinalPdfArchive(db,bytes,{
    authorId:actor.id,language:reference.payload.language.language,
    templateId:"standard",templateName:"Standard",teamId:scope.rows[0].teamId,
    cycleId:id,cycleStatus:report.sprint.status,snapshotVersion:report.version,
    renderReferenceId:reference.id,renderReferenceSha256:reference.sha256,
    optionsSnapshot:{sections:report.sections.map(section=>({key:section.key,state:section.state})),
      historyDepth:report.historyDepth,generatedAt:report.generatedAt,source:report.source,
      logoIncluded:reference.payload.logo!==null}
   },operationId);
   return {bytes,archiveId:archived.id};
  }finally{
   await db.query("SELECT pg_advisory_unlock(hashtextextended($1::text,0))",[operationId]).catch(()=>undefined);
  }
 };
 const result=teamId?await withAuthDb(run):await withLegacyTeamApi(run);
 return new Response(new Uint8Array(result.bytes),{status:200,headers:{
  "Content-Type":"application/pdf",
  "Content-Disposition":'attachment; filename="SMN-report-'+id+'-'+reference.id+'.pdf"',
  "Cache-Control":"private, no-store",
  "X-SMN-Archive-Id":result.archiveId,
  "X-Content-Type-Options":"nosniff"
 }});
 }catch(error){return Response.json({error:error instanceof Error&&error.message==="retry-conflict"?"retry-conflict":"pdf-export-or-archive-failed"},{status:error instanceof Error&&error.message==="retry-conflict"?409:503});}
}
