import {assertAiBriefSchema} from "./schema-ready";
import {randomUUID} from "node:crypto";
import {convertLegacyPrompt,isValidPromptText} from "@/lib/ai-brief-prompt";
import type {Client} from "pg";
import {initialBriefTemplates,allowedBriefFields,type BriefMode} from "@/lib/ai-brief-templates";

export type ManagedBriefTemplate={id:string;title:string;description:string;promptText:string;sections:string[];questions:string[];instructions:string[];data:string[];depth:number;revision:number;active:boolean;builtin:boolean};
const builtins:ManagedBriefTemplate[]=initialBriefTemplates.map(t=>({...t,sections:[...t.sections],questions:[...t.questions],instructions:[...t.instructions],data:[...t.data],depth:2,promptText:convertLegacyPrompt({...t,depth:2}),revision:0,active:true,builtin:true}));
const validStrings=(v:unknown,max=30):v is string[]=>Array.isArray(v)&&v.length<=max&&v.every(x=>typeof x==="string"&&x.trim().length>0&&x.length<=500);
export function validateBriefTemplate(value:unknown):value is Omit<ManagedBriefTemplate,"id"|"revision"|"active"|"builtin">{
 if(!value||typeof value!=="object"||Array.isArray(value))return false;
 const v=value as Record<string,unknown>;
 return typeof v.title==="string"&&v.title.trim().length>0&&v.title.length<=120&&typeof v.description==="string"&&v.description.length<=500&&
 validStrings(v.sections)&&v.sections.length>0&&validStrings(v.questions)&&validStrings(v.instructions)&&validStrings(v.data)&&
 v.data.every(x=>allowedBriefFields("scrum",[x]).length>0||allowedBriefFields("kanban",[x]).length>0)&&
 Number.isInteger(v.depth)&&Number(v.depth)>=1&&Number(v.depth)<=5;
}

export function validatePromptTemplate(value:unknown):value is {title:string;description:string;promptText:string}{
 if(!value||typeof value!=="object"||Array.isArray(value))return false;
 const v=value as Record<string,unknown>;
 return typeof v.title==="string"&&v.title.trim().length>0&&v.title.length<=120&&
 (v.description===undefined||typeof v.description==="string"&&v.description.length<=500)&&
 isValidPromptText(v.promptText);
}
async function ensureSchema(db:Client){
 await assertAiBriefSchema(db,"templates");
}
export async function listBriefTemplates(db:Client):Promise<ManagedBriefTemplate[]>{
 const exists=await db.query<{found:boolean}>(`SELECT to_regclass('public.smn_ai_brief_template') IS NOT NULL AS found`);
 if(!exists.rows[0]?.found)return builtins;
 const columns=await db.query<{present:boolean}>(`SELECT EXISTS(SELECT 1 FROM information_schema.columns
 WHERE table_schema='public' AND table_name='smn_ai_brief_template' AND column_name='prompt_text') AS present`);
 const migrated=columns.rows[0]?.present??false;
 const result=await db.query<(Omit<ManagedBriefTemplate,"builtin"|"promptText">&{prompt_text:string|null})>(`SELECT id::text,title,description,sections,questions,instructions,data,depth,revision,active,
 ${migrated?"prompt_text":"NULL::text AS prompt_text"} FROM public.smn_ai_brief_template ORDER BY title,id`);
 return [...builtins,...result.rows.map(x=>({...x,promptText:x.prompt_text||convertLegacyPrompt(x),builtin:false}))];
}
export async function manageBriefTemplate(db:Client,actorId:string,raw:unknown){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false as const,error:"invalid-input"};
 const v=raw as Record<string,unknown>;
 if(!["create","update","deactivate","activate"].includes(String(v.action)))return {ok:false as const,error:"invalid-input"};
 if((v.action==="create"||v.action==="update")&&!validatePromptTemplate(v.template))
  return {ok:false as const,error:"invalid-input"};
 if(v.action!=="create"&&(typeof v.id!=="string"||!/^[a-f0-9-]{36}$/i.test(v.id)))return {ok:false as const,error:"protected"};
 await db.query("BEGIN");
 try{
  const installation=await db.query(`SELECT id FROM public.smn_installation WHERE id='singleton' AND state='initialized'`);
  if(installation.rows.length!==1){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  await ensureSchema(db);
  const columns=await db.query<{present:boolean}>(`SELECT EXISTS(SELECT 1 FROM information_schema.columns
  WHERE table_schema='public' AND table_name='smn_ai_brief_template' AND column_name='prompt_text') AS present`);
  if(!columns.rows[0]?.present){await db.query("ROLLBACK");return {ok:false as const,error:"migration-required"};}
  if(v.action==="create"){
   const t=v.template as {title:string;description?:string;promptText:string},id=randomUUID();
   await db.query(`INSERT INTO public.smn_ai_brief_template
    (id,title,description,prompt_text,sections,questions,instructions,data,depth,created_by)
    VALUES($1,$2,$3,$4,'["Contexte"]'::jsonb,'[]'::jsonb,'[]'::jsonb,'[]'::jsonb,2,$5)`,
    [id,t.title.trim(),t.description??"",t.promptText,actorId]);
   await db.query("COMMIT");return {ok:true as const,id};
  }
  if(!Number.isInteger(v.revision)||Number(v.revision)<1){await db.query("ROLLBACK");return {ok:false as const,error:"invalid-input"};}
  const old=await db.query<{revision:number}>(`SELECT revision FROM public.smn_ai_brief_template WHERE id=$1 FOR UPDATE`,[v.id]);
  if(!old.rows.length){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  if(old.rows[0].revision!==v.revision){await db.query("ROLLBACK");return {ok:false as const,error:"conflict"};}
  if(v.action==="update"){
   const t=v.template as {title:string;description?:string;promptText:string};
   await db.query(`UPDATE public.smn_ai_brief_template
    SET title=$2,description=$3,prompt_text=$4,revision=revision+1,updated_at=now() WHERE id=$1`,
    [v.id,t.title.trim(),t.description??"",t.promptText]);
  }else{
   await db.query(`UPDATE public.smn_ai_brief_template SET active=$2,revision=revision+1,updated_at=now() WHERE id=$1`,[v.id,v.action==="activate"]);
  }
  await db.query("COMMIT");return {ok:true as const,id:v.id,revision:Number(v.revision)+1};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
export function briefFieldsForMode(template:ManagedBriefTemplate,mode:BriefMode){return allowedBriefFields(mode,template.data);}
