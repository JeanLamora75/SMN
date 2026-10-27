import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {SESSION_COOKIE} from "@/server/auth/guards";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {readKanbanRenderReference} from "@/server/kanban/render-reference";
import {generateFrozenPdf} from "@/server/reports/frozen-pdf";
import {storeFinalPdfArchive,readVerifiedPdfArchive} from "@/server/reports/pdf-archive-store";
import {validExportOperationId} from "@/server/reports/export-outcome";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const uuid=/^[a-f0-9-]{36}$/i;
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"generate",{type:"documents",exists:true,inScope:true,collection:true});
 if(!actor||actor.role!=="admin")return Response.json({error:"forbidden"},{status:403});
 const {id}=await params;
 if(!uuid.test(id))return Response.json({error:"invalid-input"},{status:400});
 const body=await req.json().catch(()=>null) as {reference?:unknown}|null;
 if(!body||typeof body.reference!=="string"||!uuid.test(body.reference))return Response.json({error:"invalid-input"},{status:400});
 const operationId=req.headers.get("x-smn-export-operation");
 if(!validExportOperationId(operationId))return Response.json({error:"operation-id-required"},{status:400});
 const cookie=req.cookies.get(SESSION_COOKIE)?.value;
 if(!cookie)return Response.json({error:"forbidden"},{status:403});
 const reference=await withLegacyTeamApi(db=>readKanbanRenderReference(db,id,body.reference as string)).catch(()=>null);
 if(!reference)return Response.json({error:"reference-unavailable"},{status:409});
 let origin:URL;
 try{
  origin=new URL(process.env.SMN_PDF_INTERNAL_ORIGIN??"http://127.0.0.1:3003");
  if(origin.protocol!=="http:"||!["127.0.0.1","localhost"].includes(origin.hostname)||
   origin.username||origin.password||origin.pathname!=="/"||origin.search||origin.hash)throw Error();
 }catch{return Response.json({error:"pdf-origin-invalid"},{status:503});}
 const url=new URL("/app/admin/kanban-periods/"+id+"/report/frozen",origin);
 url.searchParams.set("reference",reference.id);
 try{
  const result=await withLegacyTeamApi(async db=>{
   await db.query("SELECT pg_advisory_lock(hashtextextended($1::text,0))",[operationId]);
   try{
    const table=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_report_pdf_archive') IS NOT NULL AS present`);
    if(table.rows[0]?.present){
     const column=await db.query<{present:boolean}>(`SELECT EXISTS(SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='smn_report_pdf_archive' AND column_name='operation_id') AS present`);
     if(column.rows[0]?.present){
      const old=await db.query<{id:string;manifest:{renderReferenceId?:string;cycleId?:string;authorId?:string}}>(`
       SELECT id,manifest FROM public.smn_report_pdf_archive WHERE operation_id=$1`,[operationId]);
      if(old.rows[0]){
       const archive=old.rows[0];
       if(archive.manifest.renderReferenceId!==reference.id||archive.manifest.cycleId!==id||
        archive.manifest.authorId!==actor.id)throw Error("retry-conflict");
       const bytes=await readVerifiedPdfArchive(db,archive.id);
       if(!bytes)throw Error("archive-integrity-failed");
       return {bytes,archiveId:archive.id};
      }
     }
    }
    const bytes=await generateFrozenPdf(url.toString(),{name:SESSION_COOKIE,value:cookie});
    const scope=await db.query<{team_id:string}>(`
     SELECT p.team_id FROM public.smn_kanban_period p
     JOIN public.smn_team t ON t.id=p.team_id JOIN public.smn_installation i ON i.id=t.installation_id
     WHERE p.id=$1 AND p.deleted_at IS NULL AND i.id='singleton' AND i.state='initialized' AND lower(i.mode)='kanban'`,[id]);
    if(scope.rows.length!==1)throw Error("archive-scope-unavailable");
    const report=reference.payload.data;
    const archived=await storeFinalPdfArchive(db,bytes,{
     authorId:actor.id,language:reference.payload.language,
     templateId:"kanban-standard",templateName:"Kanban Standard",teamId:scope.rows[0].team_id,
     cycleId:id,cycleStatus:report.period.status,snapshotVersion:report.snapshotVersion,
     renderReferenceId:reference.id,renderReferenceSha256:reference.sha256,
     optionsSnapshot:{sections:reference.payload.sections,source:report.source,provisional:report.provisional}
    },operationId);
    return {bytes,archiveId:archived.id};
   }finally{
    await db.query("SELECT pg_advisory_unlock(hashtextextended($1::text,0))",[operationId]).catch(()=>undefined);
   }
  });
  return new Response(new Uint8Array(result.bytes),{status:200,headers:{
   "Content-Type":"application/pdf",
   "Content-Disposition":'attachment; filename="SMN-kanban-'+id+'-'+reference.id+'.pdf"',
   "Cache-Control":"private, no-store","X-SMN-Archive-Id":result.archiveId,
   "X-Content-Type-Options":"nosniff"
  }});
 }catch(e){
  return Response.json({error:e instanceof Error&&e.message==="retry-conflict"?"retry-conflict":"pdf-export-or-archive-failed"},
   {status:e instanceof Error&&e.message==="retry-conflict"?409:503});
 }
}
