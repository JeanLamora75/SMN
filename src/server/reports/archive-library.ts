import type {Client} from "pg";
export type ArchiveFilters={cycleId?:string;from?:string;to?:string;templateId?:string;status?:string;page?:number};
export function normalizeArchiveFilters(raw:ArchiveFilters){
 const date=(v:unknown)=>typeof v==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(v)?v:null;
 return {cycleId:typeof raw.cycleId==="string"&&/^[a-f0-9-]{36}$/i.test(raw.cycleId)?raw.cycleId:null,
 from:date(raw.from),to:date(raw.to),
 templateId:typeof raw.templateId==="string"&&/^[a-zA-Z0-9_-]{1,80}$/.test(raw.templateId)?raw.templateId:null,
 status:raw.status==="closed"||raw.status==="reopened"||raw.status==="open"?raw.status:null,
 page:Number.isSafeInteger(raw.page)&&Number(raw.page)>=1&&Number(raw.page)<=10000?Number(raw.page):1};
}
export async function searchPdfArchives(db:Client,filters:ArchiveFilters){
 const f=normalizeArchiveFilters(filters);
 const exists=await db.query<{present:boolean}>("SELECT to_regclass('public.smn_report_pdf_archive') IS NOT NULL AS present");
 if(!exists.rows[0]?.present)return {items:[],total:0,page:f.page};
 const visibility=await db.query<{present:boolean}>("SELECT to_regclass('public.smn_report_archive_visibility') IS NOT NULL AS present");
 const hiddenFilter=visibility.rows[0]?.present?
 "AND NOT EXISTS (SELECT 1 FROM public.smn_report_archive_visibility h WHERE h.archive_id=a.id)":"";
 const params=[f.cycleId,f.from,f.to,f.templateId,f.status,(f.page-1)*25] as const;
 const where=`WHERE ($1::text IS NULL OR a.cycle_id=$1)
 AND ($2::date IS NULL OR a.created_at >= $2::date)
 AND ($3::date IS NULL OR a.created_at < ($3::date + INTERVAL '1 day'))
 AND ($4::text IS NULL OR a.template_id=$4)
 AND ($5::text IS NULL OR a.cycle_status=$5)
 ${hiddenFilter} AND EXISTS (SELECT 1 FROM public.smn_sprint s
 JOIN public.smn_team t ON t.id=s.team_id
 JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE s.id=a.cycle_id AND s.team_id=a.team_id
 AND s.deleted_at IS NULL AND i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum')`;
 const total=await db.query<{count:string}>(`SELECT count(*)::text AS count FROM public.smn_report_pdf_archive a ${where}`,params.slice(0,5));
 const data=await db.query(`SELECT a.id,a.created_at::text AS "createdAt",a.cycle_id AS "cycleId",
 a.team_id AS "teamId",a.template_id AS "templateId",a.language,
 a.cycle_status AS status,a.snapshot_version AS "snapshotVersion",a.manifest,
 s.name AS "cycleName" FROM public.smn_report_pdf_archive a
 JOIN public.smn_sprint s ON s.id=a.cycle_id
 ${where} ORDER BY a.created_at DESC,a.id DESC LIMIT 25 OFFSET $6`,[...params]);
 return {items:data.rows,total:Number(total.rows[0]?.count??0),page:f.page};
}


/** Multi-team archive listing: the team must already be resolved from an active Admin. */
export async function searchTeamPdfArchives(db:Client,teamId:string,filters:ArchiveFilters){
 const f=normalizeArchiveFilters(filters);
 const exists=await db.query<{present:boolean}>("SELECT to_regclass('public.smn_report_pdf_archive') IS NOT NULL AS present");
 if(!exists.rows[0]?.present)return {items:[],total:0,page:f.page};
 const visibility=await db.query<{present:boolean}>("SELECT to_regclass('public.smn_report_archive_visibility') IS NOT NULL AS present");
 const hidden=visibility.rows[0]?.present?
 "AND NOT EXISTS(SELECT 1 FROM public.smn_report_archive_visibility v WHERE v.archive_id=a.id)":"";
 const where=`WHERE a.team_id=$1 AND ($2::text IS NULL OR a.cycle_id=$2)
 AND ($3::date IS NULL OR a.created_at >= $3::date)
 AND ($4::date IS NULL OR a.created_at < ($4::date+INTERVAL '1 day'))
 AND ($5::text IS NULL OR a.template_id=$5)
 AND ($6::text IS NULL OR a.cycle_status=$6) ${hidden}
 AND EXISTS(SELECT 1 FROM public.smn_sprint s
 JOIN public.smn_team t ON t.id=s.team_id
 WHERE s.id=a.cycle_id AND s.team_id=a.team_id
 AND t.installation_id='singleton' AND s.deleted_at IS NULL
 AND EXISTS(SELECT 1 FROM public.smn_installation i
 WHERE i.id=t.installation_id AND i.state='initialized'
 AND i.schema_version IN (28,29,30,31) AND lower(i.mode)='scrum'))`;
 const args=[teamId,f.cycleId,f.from,f.to,f.templateId,f.status];
 const total=await db.query<{count:string}>(`SELECT count(*)::text AS count
 FROM public.smn_report_pdf_archive a ${where}`,args);
 const items=await db.query(`SELECT a.id,a.created_at::text AS "createdAt",
 a.cycle_id AS "cycleId",a.team_id AS "teamId",
 a.template_id AS "templateId",a.language,a.cycle_status AS status,
 a.snapshot_version AS "snapshotVersion",a.manifest,s.name AS "cycleName"
 FROM public.smn_report_pdf_archive a
 JOIN public.smn_sprint s ON s.id=a.cycle_id AND s.team_id=a.team_id
 ${where} ORDER BY a.created_at DESC,a.id DESC LIMIT 25 OFFSET $7`,
 [...args,(f.page-1)*25]);
 return {items:items.rows,total:Number(total.rows[0]?.count??0),page:f.page};
}
