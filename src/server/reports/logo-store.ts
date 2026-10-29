import type {Client} from "pg";
import {validReportLogo,type ReportLogo} from "./logo-contract";
export async function readReportLogo(db:Client,sprintId:string):Promise<ReportLogo|null>{
 const present=await db.query<{yes:boolean}>(`SELECT to_regclass('public.smn_report_logo') IS NOT NULL AS yes`);
 if(!present.rows[0]?.yes)return null;
 const r=await db.query<{mime:string;base64:string}>(`SELECT mime,replace(encode(data,'base64'), E'\\n', '', 'g') AS base64 FROM public.smn_report_logo WHERE sprint_id=$1`,[sprintId]);
 return validReportLogo(r.rows[0])?r.rows[0]:null;
}
export async function saveReportLogo(db:Client,sprintId:string,actorId:string,logo:unknown){
 if(!/^[a-f0-9-]{36}$/i.test(sprintId)||!actorId||!(logo===null||validReportLogo(logo)))return {ok:false as const,error:"invalid-input"};
 await db.query("BEGIN");
 try{
  const scope=await db.query(`SELECT s.id FROM public.smn_sprint s JOIN public.smn_team t ON t.id=s.team_id
  JOIN public.smn_installation i ON i.id=t.installation_id WHERE s.id=$1 AND s.deleted_at IS NULL
  AND i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum' FOR UPDATE OF s`,[sprintId]);
  if(scope.rows.length!==1){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  await db.query("SELECT to_regclass('public.smn_report_logo') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("report-schema-not-ready: apply-report-schema-v32")});
  if(logo===null)await db.query(`DELETE FROM public.smn_report_logo WHERE sprint_id=$1`,[sprintId]);
  else await db.query(`INSERT INTO public.smn_report_logo(sprint_id,mime,data,updated_by)
  VALUES($1,$2,decode($3,'base64'),$4) ON CONFLICT(sprint_id)
  DO UPDATE SET mime=EXCLUDED.mime,data=EXCLUDED.data,updated_by=EXCLUDED.updated_by,updated_at=now()`,
  [sprintId,logo.mime,logo.base64,actorId]);
  await db.query("COMMIT");return {ok:true as const};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
