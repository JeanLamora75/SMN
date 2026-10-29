import {createHash,randomUUID} from "node:crypto";
import type {Client} from "pg";
import {previewSprintBatch} from "./batch-preview";
import {ensureBatchSchema} from "./batch-confirm";
import {saveGeneratedCeremonies} from "./ceremonies";
import {ensureTemplateSchema} from "./ceremony-templates";
import {ensureLunchSchema,lunchForTeam} from "./lunch";
import {resolveAdminTeam} from "@/server/teams/resolve";

type WizardInput={startOn:string;count:number;names?:string[];generateHistoricalCeremonies:boolean};
type Item={number:number;name:string;startOn:string;endOn:string;startAt:string;endAt:string;
 timeZone:string;conflicts:unknown[]};
type Preview={ok:true;valid:boolean;count:number;items:Item[]};
const validDate=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&
 Number.isFinite(Date.parse(s+"T00:00:00Z"))&&new Date(s+"T00:00:00Z").toISOString().slice(0,10)===s;

export function parseWizardInput(raw:unknown):WizardInput|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const value=raw as Record<string,unknown>;
 if(Object.keys(value).some(k=>!["startOn","count","names","generateHistoricalCeremonies"].includes(k))||
  typeof value.startOn!=="string"||!validDate(value.startOn)||
  typeof value.count!=="number"||!Number.isInteger(value.count)||value.count<1||value.count>6||
  typeof value.generateHistoricalCeremonies!=="boolean")return null;
 if(value.names!==undefined&&(!Array.isArray(value.names)||value.names.length!==value.count||
  value.names.some(n=>typeof n!=="string"||!n.trim()||n.trim().length>160)))return null;
 return {startOn:value.startOn,count:value.count,
  ...(value.names===undefined?{}:{names:(value.names as string[]).map(s=>s.trim())}),
  generateHistoricalCeremonies:value.generateHistoricalCeremonies};
}
const namesApplied=(p:Preview,input:WizardInput):Preview=>({
 ...p,items:p.items.map((item,i)=>({...item,name:input.names?.[i]??item.name}))
});
const hash=(p:Preview,settings:unknown,option:boolean)=>createHash("sha256")
 .update(JSON.stringify({items:p.items.map(x=>({
  number:x.number,name:x.name,startAt:x.startAt,endAt:x.endAt,timeZone:x.timeZone
 })),settings,option})).digest("hex");

async function schema(db:Client){
 await ensureBatchSchema(db);
 await ensureTemplateSchema(db);
 await ensureLunchSchema(db);
 await db.query("SELECT to_regclass('public.smn_sprint_wizard_preview') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("sprint-schema-not-ready: apply-sprint-aggregates-v32")});
}
async function activeTeam(db:Client,actorId:string,requestedTeamId?:string|null){
 const team=await resolveAdminTeam(db,{accountId:actorId,role:"admin"},requestedTeamId);
 if(team.mode!=="scrum")throw Error("scrum-team-unavailable");
 return team.team_id;
}
async function generationSettings(db:Client,teamId:string){
 const cadence=await db.query(`SELECT duration_weeks,start_day,start_time::text,end_day,
  end_time::text,time_zone,revision FROM public.smn_scrum_cadence WHERE team_id=$1`,[teamId]);
 const templates=await db.query(`SELECT id,name,frequency,weekday,position,local_time::text,
  duration_minutes,revision FROM public.smn_scrum_ceremony_template
  WHERE team_id=$1 AND active=true ORDER BY id`,[teamId]);
 const lunch=await db.query(`SELECT start_time::text,end_time::text,revision
  FROM public.smn_scrum_lunch WHERE team_id=$1`,[teamId]);
 return {cadence:cadence.rows[0]??null,templates:templates.rows,lunch:lunch.rows[0]??null};
}

export type WizardPreviewStage="schema"|"periods"|"team"|"lunch"|"settings"|"names"|"token";
export class WizardPreviewFailure extends Error{
 readonly stage:WizardPreviewStage;
 readonly sqlState:string|null;
 readonly originalCause:unknown;
 constructor(stage:WizardPreviewStage,cause:unknown){
  super("wizard-preview-unavailable");
  this.name="WizardPreviewFailure";
  this.stage=stage;
  this.originalCause=cause;
  const code=typeof cause==="object"&&cause!==null&&"code" in cause?
   (cause as {code?:unknown}).code:null;
  this.sqlState=typeof code==="string"&&/^[A-Z0-9]{5}$/.test(code)?code:null;
 }
}

/** Prévisualisation diagnostiquable par étape, sans divulgation SQL au navigateur. */
export async function previewWizard(db:Client,actorId:string,raw:unknown,requestedTeamId?:string|null){
 const input=parseWizardInput(raw);
 if(!input)return {ok:false as const,error:"invalid-input" as const};
 let stage:WizardPreviewStage="schema";
 try{
  await schema(db);
  stage="team";
  const teamId=await activeTeam(db,actorId,requestedTeamId);
  stage="periods";
  const draft=await previewSprintBatch(db,{startOn:input.startOn,count:input.count},teamId);
  if(!draft.ok)return draft;
  const preview=namesApplied(draft,input);
  stage="lunch";
  await lunchForTeam(db,teamId);
  stage="settings";
  const settings=await generationSettings(db,teamId);
  if(!settings.cadence)throw Error("cadence-unavailable");
  stage="names";
  const existingNames=await db.query<{name:string}>(`SELECT name FROM public.smn_sprint
   WHERE team_id=$1 AND deleted_at IS NULL AND lower(btrim(name))=ANY($2::text[])`,
   [teamId,preview.items.map(item=>item.name.toLowerCase())]);
  const nameWarnings=preview.items.filter((item,i)=>existingNames.rows.some(existing=>
   existing.name.toLowerCase()===item.name.toLowerCase())||
   preview.items.some((other,j)=>j!==i&&other.name.toLowerCase()===item.name.toLowerCase()))
   .map(item=>item.number);
  const historical=preview.items.some(x=>new Date(x.startAt).getTime()<Date.now());
  const token=preview.valid?randomUUID():null;
  stage="token";
  if(token)await db.query(`INSERT INTO public.smn_sprint_wizard_preview
   (token,team_id,actor_id,request,digest,expires_at)
   VALUES($1,$2,$3,$4::jsonb,$5,now()+interval '10 minutes')`,
   [token,teamId,actorId,JSON.stringify(input),hash(preview,settings,input.generateHistoricalCeremonies)]);
  return {...preview,token,historical,nameWarnings,cadence:settings.cadence,
   activeTemplates:settings.templates.map(t=>({id:t.id,name:t.name,revision:t.revision})),
   historicalCeremonies:input.generateHistoricalCeremonies};
 }catch(cause){
  throw new WizardPreviewFailure(stage,cause);
 }
}

export async function confirmWizard(db:Client,actorId:string,raw:unknown,requestedTeamId?:string|null){
 if(!raw||typeof raw!=="object"||Array.isArray(raw)||Object.keys(raw).length!==1||
  typeof (raw as {token?:unknown}).token!=="string"||
  !/^[0-9a-f-]{36}$/i.test((raw as {token:string}).token))
  return {ok:false as const,error:"invalid-input" as const};
 const token=(raw as {token:string}).token;
 await schema(db);
 await db.query("BEGIN");
 try{
  const rows=await db.query<{team_id:string;actor_id:string;request:WizardInput;digest:string}>(`
   SELECT team_id,actor_id,request,digest FROM public.smn_sprint_wizard_preview
   WHERE token=$1 AND consumed_at IS NULL AND expires_at>now() FOR UPDATE`,[token]);
  const saved=rows.rows[0];
  if(!saved||saved.actor_id!==actorId){
   await db.query("ROLLBACK");
   return {ok:false as const,error:"preview-expired" as const};
  }
  const authorizedTeam=await activeTeam(db,actorId,requestedTeamId);
  if(authorizedTeam!==saved.team_id){await db.query("ROLLBACK");return {ok:false as const,error:"preview-expired" as const};}
  await db.query("SELECT pg_advisory_xact_lock(hashtext($1))",[saved.team_id]);
  const input=parseWizardInput(saved.request);
  if(!input){
   await db.query("ROLLBACK");
   return {ok:false as const,error:"stale-preview" as const};
  }
  const draft=await previewSprintBatch(db,{startOn:input.startOn,count:input.count},saved.team_id);
  if(!draft.ok||!draft.valid){
   await db.query("ROLLBACK");
   return {ok:false as const,error:"stale-preview" as const};
  }
  const preview=namesApplied(draft,input);
  // Freeze the configuration used by the confirmed lot. Other writers resume after COMMIT.
  await db.query("LOCK TABLE public.smn_scrum_cadence, public.smn_scrum_lunch, public.smn_scrum_ceremony_template IN SHARE MODE");
  const settings=await generationSettings(db,saved.team_id);
  if(!settings.cadence||
   hash(preview,settings,input.generateHistoricalCeremonies)!==saved.digest){
   await db.query("ROLLBACK");
   return {ok:false as const,error:"stale-preview" as const};
  }
  const created=[];
  for(const item of preview.items){
   const id=randomUUID();
   const historical=new Date(item.startAt).getTime()<Date.now();
   const generate=!historical||input.generateHistoricalCeremonies;
   await db.query(`INSERT INTO public.smn_sprint
    (id,team_id,number,name,start_at,end_at,time_zone,created_by)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
    [id,saved.team_id,item.number,item.name,item.startAt,item.endAt,item.timeZone,actorId]);
   await db.query(`INSERT INTO public.smn_sprint_audit(id,sprint_id,action,actor_id,details)
    VALUES($1,$2,'created',$3,$4::jsonb)`,
    [randomUUID(),id,actorId,JSON.stringify({
     wizardToken:token,number:item.number,name:item.name,historical,
     generateCeremonies:generate,generationSource:historical&&generate?"reconstructed":"standard",
     settingsSnapshot:settings,startAt:item.startAt,endAt:item.endAt,timeZone:item.timeZone
    })]);
   if(generate)await saveGeneratedCeremonies(db,{
    id,startAt:item.startAt,endAt:item.endAt,timeZone:item.timeZone
   },Number(settings.cadence.duration_weeks),{reconstructed:historical});
   created.push({id,number:item.number,name:item.name,startAt:item.startAt,endAt:item.endAt,timeZone:item.timeZone});
  }
  const auditId=randomUUID();
  await db.query(`INSERT INTO public.smn_sprint_batch_audit(id,team_id,actor_id,cadence,sprints)
   VALUES($1,$2,$3,$4::jsonb,$5::jsonb)`,[auditId,saved.team_id,actorId,
   JSON.stringify({...settings.cadence,wizard:true,templates:settings.templates,
    generateHistoricalCeremonies:input.generateHistoricalCeremonies}),JSON.stringify(created)]);
  await db.query("UPDATE public.smn_sprint_wizard_preview SET consumed_at=now() WHERE token=$1",[token]);
  await db.query("COMMIT");
  return {ok:true as const,batchId:auditId,sprints:created};
 }catch(error){
  await db.query("ROLLBACK").catch(()=>undefined);
  throw error;
 }
}
