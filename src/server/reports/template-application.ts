import type {Client} from "pg";
import {standardReportTemplate,validReportTemplate,type ReportTemplate} from "@/lib/report-templates";
/** Atomic template application; never updates the source template. */
export async function applyReportTemplate(db:Client,actorId:string,sprintId:string,templateId:string){
 if(!actorId||!/^[a-f0-9-]{36}$/i.test(sprintId)||!(templateId==="standard"||/^[a-f0-9-]{36}$/i.test(templateId)))
 return {ok:false as const,error:"invalid-input"};
 await db.query("BEGIN");
 try{
 const scope=await db.query(`SELECT s.id FROM public.smn_sprint s JOIN public.smn_team t ON t.id=s.team_id
 JOIN public.smn_installation i ON i.id=t.installation_id WHERE s.id=$1 AND s.deleted_at IS NULL
 AND i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum' FOR UPDATE OF s`,[sprintId]);
 if(scope.rows.length!==1){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
 let source:ReportTemplate=standardReportTemplate();
 if(templateId!=="standard"){
 const present=await db.query<{exists:boolean}>(`SELECT to_regclass('public.smn_report_template') IS NOT NULL AS exists`);
 if(!present.rows[0]?.exists){await db.query("ROLLBACK");return {ok:false as const,error:"template-unavailable"};}
 const row=await db.query<ReportTemplate>(`SELECT id,name,false AS protected,sections,content,
 history_depth AS "historyDepth",revision FROM public.smn_report_template WHERE id=$1 FOR SHARE`,[templateId]);
 if(!row.rows[0]||!validReportTemplate(row.rows[0])){await db.query("ROLLBACK");return {ok:false as const,error:"template-unavailable"};}
 source=row.rows[0];
 }
 await db.query("SELECT to_regclass('public.smn_report_section_options') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("report-schema-not-ready: apply-report-schema-v32")});
 await db.query("SELECT to_regclass('public.smn_report_content_options') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("report-schema-not-ready: apply-report-schema-v32")});
 await db.query("SELECT to_regclass('public.smn_report_history_options') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("report-schema-not-ready: apply-report-schema-v32")});
 await db.query(`INSERT INTO public.smn_report_section_options(sprint_id,options,revision,updated_by)
 VALUES($1,$2::jsonb,1,$3) ON CONFLICT(sprint_id) DO UPDATE SET options=EXCLUDED.options,
 revision=public.smn_report_section_options.revision+1,updated_by=EXCLUDED.updated_by,updated_at=now()`,
 [sprintId,JSON.stringify(source.sections),actorId]);
 await db.query(`INSERT INTO public.smn_report_content_options(sprint_id,options,revision,updated_by)
 VALUES($1,$2::jsonb,1,$3) ON CONFLICT(sprint_id) DO UPDATE SET options=EXCLUDED.options,
 revision=public.smn_report_content_options.revision+1,updated_by=EXCLUDED.updated_by,updated_at=now()`,
 [sprintId,JSON.stringify(source.content),actorId]);
 await db.query(`INSERT INTO public.smn_report_history_options(sprint_id,depth,revision,updated_by)
 VALUES($1,$2,1,$3) ON CONFLICT(sprint_id) DO UPDATE SET depth=EXCLUDED.depth,
 revision=public.smn_report_history_options.revision+1,updated_by=EXCLUDED.updated_by,updated_at=now()`,
 [sprintId,source.historyDepth,actorId]);
 await db.query("COMMIT");
 return {ok:true as const,templateId:source.id};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
