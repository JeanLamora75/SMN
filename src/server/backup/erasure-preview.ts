import "server-only";
import {withSessionReadDb} from "../auth/database";
import type {ImpactCategory,ImpactFinding,ErasureMode} from "./exceptional-erasure-policy";
import {inspectMemberRelations,inspectTextCandidates,inspectArchiveCandidates,
 type TableImpact} from "./erasure-impact-graph";
import {inspectPrivateDocuments} from "./erasure-private-documents";
import {inspectMemberForeignKeys} from "./erasure-fk-discovery";
import {inspectVerifiedPdfArchiveText,inspectAiBriefText,inspectOfficeReportText}
 from "./erasure-report-binaries";
import {captureErasureRevision} from "./erasure-plan-revision";

const ID=/^[a-zA-Z0-9_-]{1,120}$/;
export const IMPACT_CLASSES=[
 "personal-records","associations","calendars","history","free-text",
 "private-files","archived-pdf-txt","collective-indicators","managed-backups"
] as const satisfies readonly ImpactCategory[];

export type ErasurePreview=Readonly<{
 memberId:string;memberLabel:string;mode:ErasureMode;
 capturedAt:string;complete:false;canExecute:false;
 scopeRevision:string|null;revisionReason:string;
 findings:readonly ImpactFinding[];
 observedTables:readonly TableImpact[];
 warnings:readonly ("indirect-links-unchecked"|"free-text-unchecked"|
 "archived-files-unchecked"|"indicators-unchecked"|"managed-backups-may-contain-data"|
 "external-copies-not-controlled"|"no-erasure-ledger")[];
}>;

export async function listErasureTargets():Promise<readonly {id:string;label:string}[]>{
 return withSessionReadDb(async db=>{
  const rows=await db.query<{id:string;display_name:string}>(`
   SELECT id,display_name FROM public.smn_member
   WHERE installation_id='singleton' ORDER BY display_name,id LIMIT 500`);
  return rows.rows.map(x=>({id:x.id,label:x.display_name}));
 });
}

/** Inspection only: counts are never authorization or proof of complete coverage. */
export async function previewMemberErasure(memberId:string,mode:ErasureMode):Promise<ErasurePreview>{
 if(!ID.test(memberId)||!["erase","anonymize"].includes(mode))
  throw new Error("invalid-input");
 return withSessionReadDb(async db=>{
  await db.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
  const found=await db.query<{id:string;display_name:string;email:string|null}>(`
   SELECT id,display_name,email FROM public.smn_member
   WHERE id=$1 AND installation_id='singleton'`,[memberId]);
  const member=found.rows[0];
  if(found.rowCount!==1||!member)throw new Error("target-unavailable");
  const [relations,textCandidates,archiveCandidates]=await Promise.all([
   inspectMemberRelations(db,memberId),
   inspectTextCandidates(db,memberId,[member.display_name,member.email??""]),
   inspectArchiveCandidates(db,memberId)
  ]);
  const assigned=await db.query<{team_id:string}>(`
   SELECT DISTINCT team_id FROM public.smn_member_assignment WHERE member_id::text=$1`,[memberId]);
  const privateFiles=await inspectPrivateDocuments(process.env.SMN_PRIVATE_DOCUMENTS_DIR,
   [member.display_name,member.email??""],new Set(assigned.rows.map(r=>r.team_id)));
  const teams=assigned.rows.map(r=>r.team_id);
  const tokens=[member.display_name,member.email??""]
   .map(v=>v.trim().toLocaleLowerCase("fr")).filter(v=>v.length>=3);
  const [additionalFks,officialPdfTexts,aiBriefTexts,officeTexts,revision]=await Promise.all([
   inspectMemberForeignKeys(db,memberId),
   inspectVerifiedPdfArchiveText(db,teams,tokens),
   inspectAiBriefText(db,teams,tokens),
   inspectOfficeReportText(tokens),
   captureErasureRevision(db,teams)
  ]);
  const observed=[...relations,...additionalFks,...textCandidates,
   ...archiveCandidates,...privateFiles,officialPdfTexts,aiBriefTexts,...officeTexts];
  // A positive text match is a candidate, not a verified link. The absence of
  // a match does NOT prove the person's data are absent from a given archive.
  const findings:ImpactFinding[]=IMPACT_CLASSES.map(category=>{
   const candidates=observed.filter(row=>row.category===category);
   const fullyInspected=category==="personal-records"&&
    candidates.length===1&&candidates[0].state==="inspected";
   return {category,state:fullyInspected?"inspected":"unknown",
    affectedCount:fullyInspected?candidates[0].count:null,
    action:"review",justificationRecorded:false,reidentificationRisk:"unknown"};
  });
  return {memberId,memberLabel:member.display_name,mode,capturedAt:new Date().toISOString(),
   complete:false,canExecute:false,findings,observedTables:observed,
   scopeRevision:revision.revision,revisionReason:revision.reason,
   warnings:["indirect-links-unchecked","free-text-unchecked","archived-files-unchecked",
    "indicators-unchecked","managed-backups-may-contain-data",
    "external-copies-not-controlled","no-erasure-ledger"]};
 });
}
