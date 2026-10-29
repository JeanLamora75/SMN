import type {Client} from "pg";
import {isReportLanguage,DEFAULT_REPORT_LANGUAGE} from "@/lib/report-language";
export async function readReportLanguage(db:Client,sprintId:string){
 const available=await db.query<{present:boolean}>("SELECT to_regclass('public.smn_report_language') IS NOT NULL AS present");
 if(!available.rows[0]?.present)return {language:DEFAULT_REPORT_LANGUAGE,revision:0};
 const result=await db.query<{language:string;revision:number}>("SELECT language,revision FROM public.smn_report_language WHERE sprint_id=$1",[sprintId]);
 const row=result.rows[0];return row&&isReportLanguage(row.language)?{language:row.language,revision:row.revision}:{language:DEFAULT_REPORT_LANGUAGE,revision:0};
}
export async function saveReportLanguage(db:Client,sprintId:string,actorId:string,raw:unknown){
 if(!/^[a-f0-9-]{36}$/i.test(sprintId)||!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false as const,error:"invalid-input"};
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).sort().join(",")!=="language,revision"||!isReportLanguage(v.language)||!Number.isSafeInteger(v.revision)||Number(v.revision)<0)return {ok:false as const,error:"invalid-input"};
 await db.query("BEGIN");
 try{
 const scope=await db.query(`SELECT s.id FROM public.smn_sprint s
 JOIN public.smn_team t ON t.id=s.team_id JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE s.id=$1 AND s.deleted_at IS NULL AND i.id='singleton'
 AND i.state='initialized' AND lower(i.mode)='scrum' FOR UPDATE OF s`,[sprintId]);
 if(!scope.rows.length){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
 await db.query("SELECT to_regclass('public.smn_report_language') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("report-schema-not-ready: apply-report-schema-v32")});
 const prior=await db.query<{revision:number}>("SELECT revision FROM public.smn_report_language WHERE sprint_id=$1 FOR UPDATE",[sprintId]);
 if((prior.rows[0]?.revision??0)!==v.revision){await db.query("ROLLBACK");return {ok:false as const,error:"conflict"};}
 const revision=Number(v.revision)+1;
 await db.query(`INSERT INTO public.smn_report_language(sprint_id,language,revision,updated_by)
 VALUES($1,$2,$3,$4) ON CONFLICT(sprint_id) DO UPDATE SET
 language=EXCLUDED.language,revision=EXCLUDED.revision,updated_by=EXCLUDED.updated_by,updated_at=now()`,
 [sprintId,v.language,revision,actorId]);
 await db.query("COMMIT");return {ok:true as const,revision};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
