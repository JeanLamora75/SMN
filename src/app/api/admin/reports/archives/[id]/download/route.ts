import {NextRequest} from "next/server";
import {withLegacyReportReadDb} from "@/server/reports/legacy-read";
import {readVerifiedPdfArchive} from "@/server/reports/pdf-archive-store";
import {archiveUserAuthorized} from "@/server/reports/archive-grants";
import {canAccess} from "@/server/access-policy";
import {sessionAccount} from "@/server/auth/session";
import {SESSION_COOKIE,validLocalHost} from "@/server/auth/guards";
export const dynamic="force-dynamic";
export const runtime="nodejs";
/** Exact archived bytes, never regenerated. Fail closed on hidden or corrupt PDFs. */
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!validLocalHost(req.headers.get("host")))return Response.json({error:"forbidden"},{status:403});
 const actor=await sessionAccount(req.cookies.get(SESSION_COOKIE)?.value);
 if(!actor)return Response.json({error:"forbidden"},{status:403});
 const {id}=await params;
 if(!/^[a-f0-9-]{36}$/i.test(id))return Response.json({error:"invalid-input"},{status:400});
 try{
 const bytes=await withLegacyReportReadDb(async db=>{
  const tables=await db.query<{archive:boolean;visibility:boolean}>(`SELECT
   to_regclass('public.smn_report_pdf_archive') IS NOT NULL AS archive,
   to_regclass('public.smn_report_archive_visibility') IS NOT NULL AS visibility`);
  if(!tables.rows[0]?.archive)return null;
  const hidden=tables.rows[0].visibility?"AND NOT EXISTS (SELECT 1 FROM public.smn_report_archive_visibility v WHERE v.archive_id=a.id)":"";
  const scope=await db.query(`SELECT a.id FROM public.smn_report_pdf_archive a
   JOIN public.smn_sprint s ON s.id=a.cycle_id AND s.team_id=a.team_id
   JOIN public.smn_team t ON t.id=s.team_id
   JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE a.id=$1 AND s.deleted_at IS NULL AND i.id='singleton' AND i.state='initialized'
   AND lower(i.mode)='scrum' ${hidden}`,[id]);
  if(scope.rows.length!==1)return null;
  const granted=actor.role==="admin"||await archiveUserAuthorized(db,id,actor.id);
  if(!canAccess(actor,"download",{type:"documents",exists:true,inScope:true,format:"PDF",userAuthorized:granted}))return null;
  return readVerifiedPdfArchive(db,id);
 });
 if(!bytes)return Response.json({error:"archive-unavailable"},{status:404});
 return new Response(new Uint8Array(bytes),{headers:{
 "Content-Type":"application/pdf",
 "Content-Disposition":`attachment; filename="SMN-report-${id}.pdf"`,
 "Cache-Control":"private, no-store, max-age=0",
 "X-Content-Type-Options":"nosniff"
 }});
 }catch{return Response.json({error:"archive-unavailable"},{status:503});}
}
