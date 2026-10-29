import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {defaultSectionOptions,validSectionOptions} from "@/lib/report-section-options";
export async function readReportSectionOptions(db:Client,sprintId:string){
 const exists=await db.query<{yes:boolean}>(`SELECT to_regclass('public.smn_report_section_options') IS NOT NULL AS yes`);
 if(!exists.rows[0]?.yes)return {options:defaultSectionOptions(),revision:0};
 const result=await db.query<{options:unknown;revision:number}>(`SELECT options,revision FROM public.smn_report_section_options WHERE sprint_id=$1`,[sprintId]);
 const row=result.rows[0];
 return row&&validSectionOptions(row.options)?{options:row.options,revision:row.revision}:{options:defaultSectionOptions(),revision:0};
}
export async function saveReportSectionOptions(db:Client,actorId:string,sprintId:string,input:unknown){
 if(!actorId||!/^[a-f0-9-]{36}$/i.test(sprintId)||!input||typeof input!=="object"||Array.isArray(input))return {ok:false as const,error:"invalid-input"};
 const v=input as Record<string,unknown>;
 if(Object.keys(v).sort().join(",")!=="options,revision"||!validSectionOptions(v.options)||!Number.isSafeInteger(v.revision)||Number(v.revision)<0)return {ok:false as const,error:"invalid-input"};
 await db.query("BEGIN");
 try{
  const scope=await db.query(`SELECT s.id FROM public.smn_sprint s JOIN public.smn_team t ON t.id=s.team_id
   JOIN public.smn_installation i ON i.id=t.installation_id WHERE s.id=$1 AND s.deleted_at IS NULL
   AND i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum' FOR UPDATE OF s`,[sprintId]);
  if(scope.rows.length!==1){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  await db.query("SELECT to_regclass('public.smn_report_section_options') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("report-schema-not-ready: apply-report-schema-v32")});
  const prior=await db.query<{revision:number}>(`SELECT revision FROM public.smn_report_section_options WHERE sprint_id=$1 FOR UPDATE`,[sprintId]);
  if((prior.rows[0]?.revision??0)!==v.revision){await db.query("ROLLBACK");return {ok:false as const,error:"conflict"};}
  const next=Number(v.revision)+1;
  await db.query(`INSERT INTO public.smn_report_section_options(sprint_id,options,revision,updated_by)
   VALUES($1,$2::jsonb,$3,$4) ON CONFLICT(sprint_id) DO UPDATE SET options=EXCLUDED.options,
   revision=EXCLUDED.revision,updated_by=EXCLUDED.updated_by,updated_at=now()`,[sprintId,JSON.stringify(v.options),next,actorId]);
  await db.query("SELECT to_regclass('public.smn_report_section_options_audit') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("report-schema-not-ready: apply-report-schema-v32")});
  await db.query(`INSERT INTO public.smn_report_section_options_audit(id,sprint_id,revision,options,actor_id)
   VALUES($1,$2,$3,$4::jsonb,$5)`,[randomUUID(),sprintId,next,JSON.stringify(v.options),actorId]);
  await db.query("COMMIT");return {ok:true as const,revision:next};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
