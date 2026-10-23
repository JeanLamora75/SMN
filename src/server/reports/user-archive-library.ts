import type {Client} from "pg";
export async function listUserPdfArchives(db:Client,userId:string){
 const tables=await db.query<{archive:boolean;grants:boolean;visibility:boolean}>(`SELECT
 to_regclass('public.smn_report_pdf_archive') IS NOT NULL AS archive,
 to_regclass('public.smn_report_archive_grant') IS NOT NULL AS grants,
 to_regclass('public.smn_report_archive_visibility') IS NOT NULL AS visibility`);
 const t=tables.rows[0];if(!t?.archive||!t.grants)return [];
 const hidden=t.visibility?"AND NOT EXISTS (SELECT 1 FROM public.smn_report_archive_visibility v WHERE v.archive_id=a.id)":"";
 const rows=await db.query<{id:string;createdAt:string;cycleName:string;language:string;snapshotVersion:number|null}>(`SELECT
 a.id,a.created_at::text AS "createdAt",s.name AS "cycleName",a.language,
 a.snapshot_version AS "snapshotVersion" FROM public.smn_report_pdf_archive a
 JOIN public.smn_report_archive_grant g ON g.archive_id=a.id
 JOIN public.smn_sprint s ON s.id=a.cycle_id AND s.team_id=a.team_id
 JOIN public.smn_team t ON t.id=s.team_id JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE g.user_id=$1 AND g.revoked_at IS NULL AND s.deleted_at IS NULL
 AND i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum' ${hidden}
 ORDER BY a.created_at DESC,a.id DESC LIMIT 100`,[userId]);
 return rows.rows;
}
