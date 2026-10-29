import type {Client} from "pg";
import {randomUUID} from "node:crypto";
import {defaultReportContentOptions,validReportContentOptions} from "@/lib/report-content-options";
export async function readReportContentOptions(db:Client,sprintId:string){
 const r=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_report_content_options') IS NOT NULL AS present`);
 if(!r.rows[0]?.present)return {options:defaultReportContentOptions(),revision:0};
 const found=await db.query<{options:unknown;revision:number}>(`SELECT options,revision FROM public.smn_report_content_options WHERE sprint_id=$1`,[sprintId]);
 if(!found.rows[0])return {options:defaultReportContentOptions(),revision:0};
 if(!validReportContentOptions(found.rows[0].options))throw Error("invalid-persisted-report-content-options");
 return {options:found.rows[0].options,revision:found.rows[0].revision};
}
export async function saveReportContentOptions(db:Client,actorId:string,sprintId:string,input:unknown){
 if(!actorId||!/^[a-f0-9-]{36}$/i.test(sprintId)||!input||typeof input!=="object"||Array.isArray(input))
 return {ok:false as const,error:"invalid-input"};
 const body=input as Record<string,unknown>;
 if(Object.keys(body).sort().join(",")!=="options,revision"||!validReportContentOptions(body.options)||
 !Number.isSafeInteger(body.revision)||Number(body.revision)<0)return {ok:false as const,error:"invalid-input"};
 await db.query("BEGIN");
 try{
  const scope=await db.query(`SELECT s.id FROM public.smn_sprint s JOIN public.smn_team t ON t.id=s.team_id
   JOIN public.smn_installation i ON i.id=t.installation_id WHERE s.id=$1 AND s.deleted_at IS NULL
   AND i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum' FOR UPDATE OF s`,[sprintId]);
  if(scope.rows.length!==1){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  await db.query("SELECT to_regclass('public.smn_report_content_options') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("report-schema-not-ready: apply-report-schema-v32")});
  const prior=await db.query<{revision:number}>(`SELECT revision FROM public.smn_report_content_options WHERE sprint_id=$1 FOR UPDATE`,[sprintId]);
  if((prior.rows[0]?.revision??0)!==body.revision){await db.query("ROLLBACK");return {ok:false as const,error:"conflict"};}
  const revision=Number(body.revision)+1;
  await db.query(`INSERT INTO public.smn_report_content_options(sprint_id,options,revision,updated_by)
   VALUES($1,$2::jsonb,$3,$4) ON CONFLICT(sprint_id) DO UPDATE SET options=EXCLUDED.options,
   revision=EXCLUDED.revision,updated_by=EXCLUDED.updated_by,updated_at=now()`,
   [sprintId,JSON.stringify(body.options),revision,actorId]);
  await db.query("SELECT to_regclass('public.smn_report_content_options_audit') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("report-schema-not-ready: apply-report-schema-v32")});
  await db.query(`INSERT INTO public.smn_report_content_options_audit(id,sprint_id,revision,options,actor_id)
   VALUES($1,$2,$3,$4::jsonb,$5)`,[randomUUID(),sprintId,revision,JSON.stringify(body.options),actorId]);
  await db.query("COMMIT");return {ok:true as const,revision};
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
