import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {STANDARD_REPORT_TEMPLATE_ID,standardReportTemplate,validReportTemplate,type ReportTemplate} from "@/lib/report-templates";

async function schema(db:Client){
 const check=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_report_template') IS NOT NULL AS present`);
 if(!check.rows[0]?.present)throw Error("report-template-schema-missing: run apply-deferred-schema-v32");
}
export async function listReportTemplates(db:Client):Promise<ReportTemplate[]>{
 const present=await db.query<{exists:boolean}>(`SELECT to_regclass('public.smn_report_template') IS NOT NULL AS exists`);
 if(!present.rows[0]?.exists)return [standardReportTemplate()];
 const columns=await db.query<{column_name:string}>("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='smn_report_template'");
 const names=new Set(columns.rows.map(x=>x.column_name));
 const depth=names.has("history_depth")?"history_depth":"5";
 const revision=names.has("revision")?"revision":"1";
 const rows=await db.query<{id:string;name:string;sections:ReportTemplate["sections"];content:ReportTemplate["content"];historyDepth:number;revision:number}>(`
 SELECT id,name,sections,content,${depth} AS "historyDepth",${revision} AS revision FROM public.smn_report_template ORDER BY name,id`);
 return [standardReportTemplate(),...rows.rows.map(v=>({...v,protected:false}))];
}
export async function manageReportTemplate(db:Client,actorId:string,raw:unknown){
 if(!actorId||!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false as const,error:"invalid-input"};
 const v=raw as Record<string,unknown>;
 if(!["copy","update","delete"].includes(String(v.action))||typeof v.id!=="string"||!v.id)
 return {ok:false as const,error:"invalid-input"};
 if((v.action==="delete"||v.action==="update")&&v.id===STANDARD_REPORT_TEMPLATE_ID)
 return {ok:false as const,error:"protected"};
 if(v.action==="copy"&&typeof v.name!=="string")return {ok:false as const,error:"invalid-input"};
 if(v.action==="update"&&!validReportTemplate(v.template))return {ok:false as const,error:"invalid-input"};
 if(v.action==="update"&&(v.template as ReportTemplate).id!==v.id)return {ok:false as const,error:"invalid-input"};
 await db.query("BEGIN");
 try{
 const active=await db.query(`SELECT id FROM public.smn_installation WHERE id='singleton' AND state='initialized'`);
 if(active.rows.length!==1){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
 await schema(db);
 if(v.action==="copy"){
 const from=v.id===STANDARD_REPORT_TEMPLATE_ID?standardReportTemplate():
 (await db.query<ReportTemplate>(`SELECT id,name,false AS protected,sections,content,history_depth AS "historyDepth",revision FROM public.smn_report_template WHERE id=$1`,[v.id])).rows[0];
 if(!from){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
 const name=String(v.name).trim();if(!name||name.length>120){await db.query("ROLLBACK");return {ok:false as const,error:"invalid-input"};}
 const id=randomUUID();
 await db.query(`INSERT INTO public.smn_report_template(id,name,sections,content,history_depth,revision,created_by)
 VALUES($1,$2,$3::jsonb,$4::jsonb,$5,1,$6)`,[id,name,JSON.stringify(from.sections),JSON.stringify(from.content),from.historyDepth,actorId]);
 await db.query("COMMIT");return {ok:true as const,id};
 }
 const old=await db.query<{revision:number}>(`SELECT revision FROM public.smn_report_template WHERE id=$1 FOR UPDATE`,[v.id]);
 if(!old.rows.length){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
 if(v.action==="delete"){
 // Archived reports may reference this id later; physical deletion requires an explicit archival policy.
 await db.query("ROLLBACK");return {ok:false as const,error:"deletion-not-supported"};
 }
 const template=v.template as ReportTemplate;
 if(old.rows[0].revision!==template.revision){await db.query("ROLLBACK");return {ok:false as const,error:"conflict"};}
 await db.query(`UPDATE public.smn_report_template SET name=$2,sections=$3::jsonb,content=$4::jsonb,
 history_depth=$5,revision=revision+1 WHERE id=$1`,[v.id,template.name.trim(),JSON.stringify(template.sections),JSON.stringify(template.content),template.historyDepth]);
 await db.query("COMMIT");return {ok:true as const,id:v.id,revision:template.revision+1};
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
