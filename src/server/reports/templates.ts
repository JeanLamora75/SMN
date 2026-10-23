import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {STANDARD_REPORT_TEMPLATE_ID,standardReportTemplate,mayDeleteReportTemplate,type ReportTemplate} from "@/lib/report-templates";
export async function listReportTemplates(db:Client):Promise<ReportTemplate[]>{
 const present=await db.query<{exists:boolean}>(`SELECT to_regclass('public.smn_report_template') IS NOT NULL AS exists`);
 if(!present.rows[0]?.exists)return [standardReportTemplate()];
 const results=await db.query<{id:string;name:string;sections:ReportTemplate["sections"];content:ReportTemplate["content"]}>(`SELECT id,name,sections,content FROM public.smn_report_template ORDER BY name,id`);
 return [standardReportTemplate(),...results.rows.map(x=>({...x,protected:false}))];
}
export async function manageReportTemplate(db:Client,actorId:string,raw:unknown){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false as const,error:"invalid-input"};
 const v=raw as Record<string,unknown>;
 if(v.action!=="copy"&&v.action!=="delete")return {ok:false as const,error:"invalid-input"};
 if(v.action==="delete"&&v.id===STANDARD_REPORT_TEMPLATE_ID)return {ok:false as const,error:"protected"};
 if(v.action==="copy"&&v.id!==STANDARD_REPORT_TEMPLATE_ID)return {ok:false as const,error:"invalid-input"};
 if(typeof v.id!=="string"||!v.id||!actorId)return {ok:false as const,error:"invalid-input"};
 await db.query("BEGIN");
 try{
 const scope=await db.query(`SELECT id FROM public.smn_installation WHERE id='singleton' AND state='initialized'`);
 if(!scope.rows.length){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
 if(v.action==="delete"){
 if(!mayDeleteReportTemplate(v.id)){await db.query("ROLLBACK");return {ok:false as const,error:"protected"};}
 const table=await db.query<{exists:boolean}>(`SELECT to_regclass('public.smn_report_template') IS NOT NULL AS exists`);
 if(!table.rows[0]?.exists){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
 const found=await db.query(`DELETE FROM public.smn_report_template WHERE id=$1 RETURNING id`,[v.id]);
 if(!found.rows.length){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
 await db.query("COMMIT");return {ok:true as const,id:v.id};
 }
 if(typeof v.name!=="string"||!v.name.trim()||v.name.length>120){await db.query("ROLLBACK");return {ok:false as const,error:"invalid-input"};}
 await db.query(`CREATE TABLE IF NOT EXISTS public.smn_report_template(
 id text PRIMARY KEY CHECK(id<>'standard'),name text NOT NULL,
 sections jsonb NOT NULL,content jsonb NOT NULL,
 created_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now())`);
 const standard=standardReportTemplate(),id=randomUUID();
 await db.query(`INSERT INTO public.smn_report_template(id,name,sections,content,created_by)
 VALUES($1,$2,$3::jsonb,$4::jsonb,$5)`,[id,v.name.trim(),JSON.stringify(standard.sections),JSON.stringify(standard.content),actorId]);
 await db.query("COMMIT");return {ok:true as const,id};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
