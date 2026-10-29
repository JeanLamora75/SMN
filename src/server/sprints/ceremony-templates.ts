import {resolveAdminTeam} from "@/server/teams/resolve";
import {evaluateSchemaCapability} from "@/server/schema/compatibility";
import {randomUUID} from "node:crypto";
import type {Client} from "pg";
export type TemplateInput={name:string;frequency:"daily"|"weekly"|"sprint";weekday:number|null;position:"start"|"end"|null;time:string;duration:number};
// Valeurs initiales du MVP, sans règles additionnelles : l'administrateur peut tout modifier/désactiver.
export const DEFAULT_SCRUM_CEREMONY_TEMPLATES: ReadonlyArray<TemplateInput> = [
 {name:"Sprint Planning",frequency:"sprint",weekday:null,position:"start",time:"09:30",duration:120},
 {name:"Daily Scrum",frequency:"daily",weekday:null,position:null,time:"09:00",duration:15},
 {name:"Sprint Review",frequency:"sprint",weekday:null,position:"end",time:"15:00",duration:60},
 {name:"Sprint Retrospective",frequency:"sprint",weekday:null,position:"end",time:"16:30",duration:60},
];

// Appel à la première installation Scrum ; pour une base pilote déjà installée,
// la commande dédiée db:sync:ceremonies assure le rattrapage idempotent.
export async function seedDefaultScrumCeremonyTemplates(db:Client,teamId:string){
 await ensureTemplateSchema(db);
 let inserted=0;
 for(const template of DEFAULT_SCRUM_CEREMONY_TEMPLATES){
  const row=await db.query<{id:string}>(`INSERT INTO public.smn_scrum_ceremony_template
   (id,team_id,name,frequency,weekday,position,local_time,duration_minutes,active)
   SELECT $1,$2,$3,$4,$5,$6,$7,$8,true
   WHERE NOT EXISTS (
    SELECT 1 FROM public.smn_scrum_ceremony_template
    WHERE team_id=$2 AND lower(btrim(name))=lower(btrim($3))
   ) RETURNING id`,
   [randomUUID(),teamId,template.name,template.frequency,template.weekday,
    template.position,template.time,template.duration]);
  const id=row.rows[0]?.id;
  if(!id)continue;
  await db.query(`INSERT INTO public.smn_scrum_ceremony_template_history
   (id,template_id,revision,before_values,after_values,actor_id)
   VALUES($1,$2,1,NULL,$3::jsonb,NULL)`,
   [randomUUID(),id,JSON.stringify({...template,active:true})]);
  inserted++;
 }
 return inserted;
}

const validTime=(v:unknown):v is string=>typeof v==="string"&&/^([01]\d|2[0-3]):[0-5]\d$/.test(v);
export function parseTemplate(raw:unknown):TemplateInput|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).sort().join(",")!==["duration","frequency","name","position","time","weekday"].sort().join(","))return null;
 if(typeof v.name!=="string"||!v.name.trim()||v.name.trim().length>120||!validTime(v.time)||
 !Number.isInteger(v.duration)||Number(v.duration)<1||Number(v.duration)>480)return null;
 if(v.frequency==="daily"&&v.weekday===null&&v.position===null||
 v.frequency==="weekly"&&Number.isInteger(v.weekday)&&Number(v.weekday)>=1&&Number(v.weekday)<=7&&v.position===null||
 v.frequency==="sprint"&&v.weekday===null&&(v.position==="start"||v.position==="end"))
 return {name:v.name.trim(),frequency:v.frequency,weekday:v.weekday as number|null,position:v.position as "start"|"end"|null,time:v.time,duration:v.duration as number};
 return null;
}
export async function ensureTemplateSchema(db:Client){
 await db.query(`CREATE TABLE IF NOT EXISTS public.smn_scrum_ceremony_template(
 id text PRIMARY KEY,
 team_id text NOT NULL REFERENCES public.smn_team(id) ON DELETE RESTRICT,
 name text NOT NULL CHECK(length(btrim(name)) BETWEEN 1 AND 120),
 frequency text NOT NULL CHECK(frequency IN ('daily','weekly','sprint')),
 weekday integer CHECK(weekday BETWEEN 1 AND 7),
 position text CHECK(position IN ('start','end')),
 local_time time NOT NULL,
 duration_minutes integer NOT NULL CHECK(duration_minutes BETWEEN 1 AND 480),
 active boolean NOT NULL DEFAULT true,
 revision integer NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK((frequency='daily' AND weekday IS NULL AND position IS NULL)
 OR (frequency='weekly' AND weekday IS NOT NULL AND position IS NULL)
 OR (frequency='sprint' AND weekday IS NULL AND position IS NOT NULL)))`);
 await db.query(`CREATE TABLE IF NOT EXISTS public.smn_scrum_ceremony_template_history(
 id text PRIMARY KEY,
 template_id text NOT NULL REFERENCES public.smn_scrum_ceremony_template(id) ON DELETE RESTRICT,
 revision integer NOT NULL,
 before_values jsonb,
 after_values jsonb NOT NULL,
 actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 changed_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(template_id,revision))`);
}
async function activeTeam(db:Client,actor?:{accountId:string;role:"admin"|"user"},requestedTeamId?:string|null){
 const state=await db.query<{schema_version:number}>("SELECT schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'");
 const version=state.rows[0]?.schema_version;
 if(evaluateSchemaCapability(version,"multi-team").ok){
  if(!actor)throw Error("team-access-forbidden");
  const selected=await resolveAdminTeam(db,actor,requestedTeamId);
  if(selected.mode!=="scrum")throw Error("scrum-team-unavailable");
  return selected.team_id;
 }
 if(version===undefined||version>27)throw Error("team-schema-unavailable");
 const r=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum'`);
 if(r.rows.length!==1||(requestedTeamId&&requestedTeamId!==r.rows[0].id))throw Error("scrum-team-unavailable");
 return r.rows[0].id;
}
export async function listTemplates(db:Client,actor?:{accountId:string;role:"admin"|"user"},requestedTeamId?:string|null){
 const teamId=await activeTeam(db,actor,requestedTeamId);
 const r=await db.query(`SELECT id,name,frequency,weekday,position,local_time::text AS time,duration_minutes AS duration,active,revision
 FROM public.smn_scrum_ceremony_template WHERE team_id=$1 ORDER BY created_at,id`,[teamId]);
 return r.rows;
}
export async function saveTemplate(db:Client,actorId:string,raw:unknown,requestedTeamId?:string|null){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false as const,error:"invalid-input" as const};
 const obj=raw as Record<string,unknown>;
 const input=parseTemplate(obj.template);if(!input||Object.keys(obj).some(k=>!["id","revision","template","active"].includes(k)))return {ok:false as const,error:"invalid-input" as const};
 if(obj.active!==undefined&&typeof obj.active!=="boolean")return {ok:false as const,error:"invalid-input" as const};
 const isUpdate=typeof obj.id==="string"&&/^[0-9a-f-]{36}$/i.test(obj.id);
 if(obj.id!==undefined&&!isUpdate||isUpdate&&(!Number.isSafeInteger(obj.revision)||Number(obj.revision)<1))return {ok:false as const,error:"invalid-input" as const};
 await ensureTemplateSchema(db);const teamId=await activeTeam(db,{accountId:actorId,role:"admin"},requestedTeamId);
 await db.query("BEGIN");
 try{
  const id=isUpdate?obj.id as string:randomUUID();
  let before:Record<string,unknown>|null=null;
  if(isUpdate){
   const old=await db.query(`SELECT * FROM public.smn_scrum_ceremony_template WHERE id=$1 AND team_id=$2 FOR UPDATE`,[id,teamId]);
   if(!old.rows[0]||old.rows[0].revision!==obj.revision){await db.query("ROLLBACK");return {ok:false as const,error:"conflict" as const};}
   before=old.rows[0];
   await db.query(`UPDATE public.smn_scrum_ceremony_template SET name=$3,frequency=$4,weekday=$5,position=$6,local_time=$7,duration_minutes=$8,active=$9,
   revision=revision+1,updated_at=now() WHERE id=$1 AND team_id=$2`,
   [id,teamId,input.name,input.frequency,input.weekday,input.position,input.time,input.duration,obj.active??old.rows[0].active]);
  }else{
   await db.query(`INSERT INTO public.smn_scrum_ceremony_template(id,team_id,name,frequency,weekday,position,local_time,duration_minutes,active)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[id,teamId,input.name,input.frequency,input.weekday,input.position,input.time,input.duration,obj.active??true]);
  }
  const revision=isUpdate?Number(obj.revision)+1:1;
  await db.query(`INSERT INTO public.smn_scrum_ceremony_template_history(id,template_id,revision,before_values,after_values,actor_id)
  VALUES($1,$2,$3,$4::jsonb,$5::jsonb,$6)`,[randomUUID(),id,revision,before?JSON.stringify(before):null,JSON.stringify({...input,active:obj.active??before?.active??true}),actorId]);
  await db.query("COMMIT");return {ok:true as const,id,revision};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
