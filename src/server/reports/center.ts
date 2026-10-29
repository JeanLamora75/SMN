import type {Client} from "pg";
import {listReportTemplates} from "./templates";
import {searchPdfArchives,searchTeamPdfArchives} from "./archive-library";
import {listUserPdfArchives} from "./user-archive-library";
import {assertLegacyTeamApi} from "@/server/teams/legacy";
import type {TeamContextRow} from "@/server/teams/resolve";
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
 // Refuser la liste historique interéquipes sur une installation v28.
 await assertLegacyTeamApi(db);
 const documents=await listCenterDocuments(db);
 const cycles=await db.query<{id:string;name:string}>(`SELECT s.id,s.name FROM public.smn_sprint s JOIN public.smn_team t ON t.id=s.team_id JOIN public.smn_installation i ON i.id=t.installation_id WHERE s.deleted_at IS NULL AND i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum' ORDER BY s.start_at DESC LIMIT 500`);
 const templates=await listReportTemplates(db);
 const archives=role==="admin"?
 (await searchPdfArchives(db,{page:1})).items.map(a=>({id:String(a.id),cycleId:String(a.cycleId),cycleName:String(a.cycleName),createdAt:String(a.createdAt),language:String(a.language),snapshotVersion:a.snapshotVersion as number|null})):
 await listUserPdfArchives(db,userId).then(rows=>rows.map(a=>({...a,cycleId:""})));
 return {documents,templates,archives,cycles:cycles.rows};
}

/** Centre Rapports v28 : seule une équipe Admin préalablement résolue est
 * autorisée. Documents et cycles restent strictement filtrés sur teamId.
 * Les archives sont filtrées strictement par équipe ; les téléchargements
 * appliquent également une vérification serveur indépendante.
 */
export async function readTeamCenter(db:Client,team:TeamContextRow){
 if(!["scrum","kanban"].includes(team.mode))
  throw Error("report-team-mode-unavailable");
 if(team.mode!=="scrum")
  return {documents:[] as CenterDocument[],cycles:[] as {id:string;name:string}[],
   templates:[],archives:[]};
 const valid=await db.query<{id:string}>(`
  SELECT t.id FROM public.smn_team t
  JOIN public.smn_installation i ON i.id=t.installation_id
  WHERE t.id=$1 AND t.installation_id='singleton'
   AND i.state='initialized' AND i.schema_version BETWEEN 28 AND 32\n   AND lower(COALESCE(to_jsonb(t)->>'agile_mode',i.mode))='scrum'
  LIMIT 2`,[team.team_id]);
 if(valid.rows.length!==1)throw Error("report-team-unavailable");
 const cycles=await db.query<{id:string;name:string}>(`
  SELECT s.id,s.name FROM public.smn_sprint s
  JOIN public.smn_team t ON t.id=s.team_id
  WHERE s.team_id=$1 AND t.installation_id='singleton'
   AND s.deleted_at IS NULL
  ORDER BY s.start_at DESC,s.id DESC LIMIT 500`,[team.team_id]);
 const exists=await db.query<{present:boolean}>(
  "SELECT to_regclass('public.smn_report_document') IS NOT NULL AS present");
 const documents=exists.rows[0]?.present?
  (await db.query<CenterDocument>(`
   SELECT d.id,d.sprint_id AS "sprintId",s.name AS "sprintName",
    d.title,d.template_id AS "templateId",
    d.template_version AS "templateVersion",
    d.language,d.status,d.updated_at::text AS "updatedAt"
   FROM public.smn_report_document d
   JOIN public.smn_sprint s ON s.id=d.sprint_id AND s.team_id=d.team_id
   JOIN public.smn_team t ON t.id=d.team_id
   WHERE d.team_id=$1 AND t.installation_id='singleton'
    AND s.deleted_at IS NULL
   ORDER BY d.updated_at DESC,d.id DESC LIMIT 500`,[team.team_id])).rows:
  [] as CenterDocument[];
 // Ne jamais appeler searchPdfArchives sans filtre team_id : le seul cycleId
 // n'est pas une autorisation et ses fonctions actuelles sont monoéquipe.
 const archiveResult=await searchTeamPdfArchives(db,team.team_id,{page:1});
 return {documents,cycles:cycles.rows,templates:await listReportTemplates(db),
  archives:archiveResult.items.map(a=>({id:String(a.id),cycleId:String(a.cycleId),cycleName:String(a.cycleName),createdAt:String(a.createdAt),language:String(a.language),snapshotVersion:a.snapshotVersion as number|null}))};
}
