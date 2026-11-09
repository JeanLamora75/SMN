import "server-only";
import {withSessionReadDb} from "../auth/database";
import type {ImpactCategory,ImpactFinding,ErasureMode} from "./exceptional-erasure-policy";
import {inspectMemberRelations,inspectTextCandidates,inspectArchiveCandidates,
 type TableImpact} from "./erasure-impact-graph";

const ID=/^[a-zA-Z0-9_-]{1,120}$/;
export const IMPACT_CLASSES=[
 "personal-records","associations","calendars","history","free-text",
 "private-files","archived-pdf-txt","collective-indicators","managed-backups"
] as const satisfies readonly ImpactCategory[];

export type ErasurePreview=Readonly<{
 memberId:string;memberLabel:string;mode:ErasureMode;
 capturedAt:string;complete:false;canExecute:false;
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
  const observed=[...relations,...textCandidates,...archiveCandidates];
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
   warnings:["indirect-links-unchecked","free-text-unchecked","archived-files-unchecked",
    "indicators-unchecked","managed-backups-may-contain-data",
    "external-copies-not-controlled","no-erasure-ledger"]};
 });
}
