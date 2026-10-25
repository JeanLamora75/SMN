import type {Client} from "pg";
import {listReportTemplates} from "./templates";
import {searchPdfArchives} from "./archive-library";
import {listUserPdfArchives} from "./user-archive-library";
export type CenterDocument={id:string;sprintId:string;sprintName:string;title:string;templateId:string;templateVersion:number;language:string;status:string;updatedAt:string};
export async function listCenterDocuments(db:Client){
 const present=await db.query<{yes:boolean}>(`SELECT to_regclass('public.smn_report_document') IS NOT NULL AS yes`);
 if(!present.rows[0]?.yes)return [] as CenterDocument[];
 const rows=await db.query<CenterDocument>(`SELECT d.id,d.sprint_id AS "sprintId",s.name AS "sprintName",
 d.title,d.template_id AS "templateId",d.template_version AS "templateVersion",
 d.language,d.status,d.updated_at::text AS "updatedAt"
 FROM public.smn_report_document d JOIN public.smn_sprint s ON s.id=d.sprint_id AND s.team_id=d.team_id
 JOIN public.smn_team t ON t.id=s.team_id JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE s.deleted_at IS NULL AND i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum'
 ORDER BY d.updated_at DESC,d.id DESC LIMIT 500`);
 return rows.rows;
}
export async function readCenter(db:Client,role:"admin"|"user",userId:string){
 const documents=await listCenterDocuments(db);
 const templates=await listReportTemplates(db);
 const archives=role==="admin"?
 (await searchPdfArchives(db,{page:1})).items.map(a=>({id:String(a.id),cycleId:String(a.cycleId),cycleName:String(a.cycleName),createdAt:String(a.createdAt),language:String(a.language),snapshotVersion:a.snapshotVersion as number|null})):
 await listUserPdfArchives(db,userId).then(rows=>rows.map(a=>({...a,cycleId:""})));
 return {documents,templates,archives};
}
