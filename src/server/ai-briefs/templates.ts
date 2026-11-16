import {assertAiBriefSchema} from "./schema-ready";
import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {initialBriefTemplates} from "@/lib/ai-brief-templates";
import {isValidPromptText} from "@/lib/ai-brief-prompt";

export type ManagedBriefTemplate={
 id:string;title:string;description:string;promptText:string;
 revision:number;active:boolean;builtin:boolean;
};
const builtins:ManagedBriefTemplate[]=initialBriefTemplates.map(t=>({
 ...t,revision:0,active:true,builtin:true
}));

export function validatePromptTemplate(value:unknown):value is {title:string;description?:string;promptText:string}{
 if(!value||typeof value!=="object"||Array.isArray(value))return false;
 const v=value as Record<string,unknown>;
 return typeof v.title==="string"&&v.title.trim().length>0&&v.title.length<=120&&
  (v.description===undefined||typeof v.description==="string"&&v.description.length<=500)&&
  isValidPromptText(v.promptText);
}
/** Fail closed on partial schema transitions; do not read dropped legacy fields. */
async function ensureSchema(db:Client){
 await assertAiBriefSchema(db,"templates");
 const columns=await db.query<{present:boolean}>(`SELECT EXISTS (
  SELECT 1 FROM information_schema.columns WHERE table_schema='public'
  AND table_name='smn_ai_brief_template' AND column_name='prompt_text') AS present`);
 if(!columns.rows[0]?.present)throw Error("ai-brief-prompt-migration-required");
}
export async function listBriefTemplates(db:Client):Promise<ManagedBriefTemplate[]>{
 await ensureSchema(db);
 const rows=await db.query<{
  id:string;title:string;description:string;prompt_text:string;
  revision:number;active:boolean;
 }>(`SELECT id::text,title,description,prompt_text,revision,active
 FROM public.smn_ai_brief_template ORDER BY title,id`);
 if(rows.rows.some(t=>!isValidPromptText(t.prompt_text)))
  throw Error("ai-brief-prompt-backfill-incomplete");
 return [...builtins,...rows.rows.map(t=>({
  id:t.id,title:t.title,description:t.description,promptText:t.prompt_text,
  revision:t.revision,active:t.active,builtin:false
 }))];
}
export async function manageBriefTemplate(db:Client,actorId:string,raw:unknown){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false as const,error:"invalid-input"};
 const v=raw as Record<string,unknown>;
 if(!["create","update","deactivate","activate"].includes(String(v.action)))
  return {ok:false as const,error:"invalid-input"};
 if((v.action==="create"||v.action==="update")&&!validatePromptTemplate(v.template))
  return {ok:false as const,error:"invalid-input"};
 if(v.action!=="create"&&(typeof v.id!=="string"||!/^[a-f0-9-]{36}$/i.test(v.id)))
  return {ok:false as const,error:"protected"};
 await db.query("BEGIN");
 try{
  const installation=await db.query("SELECT id FROM public.smn_installation WHERE id='singleton' AND state='initialized'");
  if(installation.rows.length!==1){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  await ensureSchema(db);
  if(v.action==="create"){
   const t=v.template as {title:string;description?:string;promptText:string};
   const id=randomUUID();
   await db.query(`INSERT INTO public.smn_ai_brief_template
    (id,title,description,prompt_text,created_by)
    VALUES($1,$2,$3,$4,$5)`,[id,t.title.trim(),t.description??"",t.promptText,actorId]);
   await db.query("COMMIT");
   return {ok:true as const,id};
  }
  if(!Number.isSafeInteger(v.revision)||Number(v.revision)<1){
   await db.query("ROLLBACK");return {ok:false as const,error:"invalid-input"};
  }
  const old=await db.query<{revision:number}>(`
   SELECT revision FROM public.smn_ai_brief_template WHERE id=$1 FOR UPDATE`,[v.id]);
  if(!old.rows.length){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  if(old.rows[0].revision!==v.revision){
   await db.query("ROLLBACK");return {ok:false as const,error:"conflict"};
  }
  if(v.action==="update"){
   const t=v.template as {title:string;description?:string;promptText:string};
   await db.query(`UPDATE public.smn_ai_brief_template
    SET title=$2,description=$3,prompt_text=$4,revision=revision+1,updated_at=now()
    WHERE id=$1`,[v.id,t.title.trim(),t.description??"",t.promptText]);
  }else{
   await db.query(`UPDATE public.smn_ai_brief_template
    SET active=$2,revision=revision+1,updated_at=now() WHERE id=$1`,
    [v.id,v.action==="activate"]);
  }
  await db.query("COMMIT");
  return {ok:true as const,id:v.id,revision:Number(v.revision)+1};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
