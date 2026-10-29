import {assertAiBriefSchema} from "./schema-ready";
import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {initialBriefTemplates,allowedBriefFields,type BriefMode} from "@/lib/ai-brief-templates";

export type ManagedBriefTemplate={id:string;title:string;description:string;sections:string[];questions:string[];instructions:string[];data:string[];depth:number;revision:number;active:boolean;builtin:boolean};
const builtins:ManagedBriefTemplate[]=initialBriefTemplates.map(t=>({...t,sections:[...t.sections],questions:[...t.questions],instructions:[...t.instructions],data:[...t.data],depth:2,revision:0,active:true,builtin:true}));
const validStrings=(v:unknown,max=30):v is string[]=>Array.isArray(v)&&v.length<=max&&v.every(x=>typeof x==="string"&&x.trim().length>0&&x.length<=500);
export function validateBriefTemplate(value:unknown):value is Omit<ManagedBriefTemplate,"id"|"revision"|"active"|"builtin">{
 if(!value||typeof value!=="object"||Array.isArray(value))return false;
 const v=value as Record<string,unknown>;
 return typeof v.title==="string"&&v.title.trim().length>0&&v.title.length<=120&&typeof v.description==="string"&&v.description.length<=500&&
 validStrings(v.sections)&&v.sections.length>0&&validStrings(v.questions)&&validStrings(v.instructions)&&validStrings(v.data)&&
 v.data.every(x=>allowedBriefFields("scrum",[x]).length>0||allowedBriefFields("kanban",[x]).length>0)&&
 Number.isInteger(v.depth)&&Number(v.depth)>=1&&Number(v.depth)<=5;
}
async function ensureSchema(db:Client){
 await assertAiBriefSchema(db,"templates");
}
export async function listBriefTemplates(db:Client):Promise<ManagedBriefTemplate[]>{
 const exists=await db.query<{found:boolean}>(`SELECT to_regclass('public.smn_ai_brief_template') IS NOT NULL AS found`);
 if(!exists.rows[0]?.found)return builtins;
 const result=await db.query<Omit<ManagedBriefTemplate,"builtin">>(`SELECT id::text,title,description,sections,questions,instructions,data,depth,revision,active FROM public.smn_ai_brief_template ORDER BY title,id`);
 return [...builtins,...result.rows.map(x=>({...x,builtin:false}))];
}
export async function manageBriefTemplate(db:Client,actorId:string,raw:unknown){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false as const,error:"invalid-input"};
 const v=raw as Record<string,unknown>;
 if(!["create","update","deactivate","activate"].includes(String(v.action)))return {ok:false as const,error:"invalid-input"};
 if(v.action==="create"&&!validateBriefTemplate(v.template))return {ok:false as const,error:"invalid-input"};
 if(v.action==="update"&&!validateBriefTemplate(v.template))return {ok:false as const,error:"invalid-input"};
 if(v.action!=="create"&&(typeof v.id!=="string"||!/^[a-f0-9-]{36}$/i.test(v.id)))return {ok:false as const,error:"protected"};
 await db.query("BEGIN");
 try{
  const installation=await db.query(`SELECT id FROM public.smn_installation WHERE id='singleton' AND state='initialized'`);
  if(installation.rows.length!==1){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  await ensureSchema(db);
  if(v.action==="create"){
   const t=v.template as ManagedBriefTemplate,id=randomUUID();
   await db.query(`INSERT INTO public.smn_ai_brief_template(id,title,description,sections,questions,instructions,data,depth,created_by)
   VALUES($1,$2,$3,$4::jsonb,$5::jsonb,$6::jsonb,$7::jsonb,$8,$9)`,
   [id,t.title.trim(),t.description,t.sections,t.questions,t.instructions,t.data,t.depth,actorId].map((x,i)=>i>=3&&i<=6?JSON.stringify(x):x));
   await db.query("COMMIT");return {ok:true as const,id};
  }
  if(!Number.isInteger(v.revision)||Number(v.revision)<1){await db.query("ROLLBACK");return {ok:false as const,error:"invalid-input"};}
  const old=await db.query<{revision:number}>(`SELECT revision FROM public.smn_ai_brief_template WHERE id=$1 FOR UPDATE`,[v.id]);
  if(!old.rows.length){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  if(old.rows[0].revision!==v.revision){await db.query("ROLLBACK");return {ok:false as const,error:"conflict"};}
  if(v.action==="update"){
   const t=v.template as ManagedBriefTemplate;
   await db.query(`UPDATE public.smn_ai_brief_template SET title=$2,description=$3,sections=$4::jsonb,questions=$5::jsonb,
   instructions=$6::jsonb,data=$7::jsonb,depth=$8,revision=revision+1,updated_at=now() WHERE id=$1`,
   [v.id,t.title.trim(),t.description,JSON.stringify(t.sections),JSON.stringify(t.questions),JSON.stringify(t.instructions),JSON.stringify(t.data),t.depth]);
  }else{
   await db.query(`UPDATE public.smn_ai_brief_template SET active=$2,revision=revision+1,updated_at=now() WHERE id=$1`,[v.id,v.action==="activate"]);
  }
  await db.query("COMMIT");return {ok:true as const,id:v.id,revision:Number(v.revision)+1};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
export function briefFieldsForMode(template:ManagedBriefTemplate,mode:BriefMode){return allowedBriefFields(mode,template.data);}
