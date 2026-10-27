import {createHash,randomUUID} from "node:crypto";
import type {Client} from "pg";
import {assertLegacyTeamApi} from "@/server/teams/legacy";
import {previewSprintBatch,validBatchRequest} from "./batch-preview";
import {ensureSprintSchema} from "./creation";
import {saveGeneratedCeremonies} from "./ceremonies";

type Item={number:number;name:string;startOn:string;endOn:string;startAt:string;endAt:string;timeZone:string;conflicts:unknown[]};
type Preview={ok:true;valid:boolean;items:Item[];count:number};
const digest=(items:Item[])=>createHash("sha256").update(JSON.stringify(items.map(i=>({number:i.number,name:i.name,startAt:i.startAt,endAt:i.endAt,timeZone:i.timeZone})))).digest("hex");
export async function ensureBatchSchema(db:Client){
 await ensureSprintSchema(db);
 await db.query(`CREATE TABLE IF NOT EXISTS public.smn_sprint_batch_preview(
 token text PRIMARY KEY,team_id text NOT NULL REFERENCES public.smn_team(id) ON DELETE RESTRICT,
 actor_id text NOT NULL REFERENCES public.smn_account(id) ON DELETE RESTRICT,
 start_on date NOT NULL, count integer NOT NULL CHECK(count BETWEEN 2 AND 6),
 digest text NOT NULL, expires_at timestamptz NOT NULL,
 consumed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
 )`);
 await db.query(`CREATE TABLE IF NOT EXISTS public.smn_sprint_batch_audit(
 id text PRIMARY KEY,team_id text NOT NULL REFERENCES public.smn_team(id) ON DELETE RESTRICT,
 actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 occurred_at timestamptz NOT NULL DEFAULT now(),
 cadence jsonb NOT NULL,sprints jsonb NOT NULL
 )`);
}
async function activeTeam(db:Client){
 const r=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum'`);
 if(r.rows.length!==1)throw Error("scrum-team-unavailable");
 return r.rows[0].id;
}
export async function issueBatchPreview(db:Client,actorId:string,raw:unknown){
 if(!validBatchRequest(raw)||raw.count<2)return {ok:false as const,error:"invalid-input" as const};
 await assertLegacyTeamApi(db);
await ensureBatchSchema(db);
 const result=await previewSprintBatch(db,raw);
 if(!result.ok)return result;
 const teamId=await activeTeam(db);
 if(!result.valid)return {...result,token:null};
 const token=randomUUID();
 await db.query(`INSERT INTO public.smn_sprint_batch_preview(token,team_id,actor_id,start_on,count,digest,expires_at)
 VALUES($1,$2,$3,$4,$5,$6,now()+interval '10 minutes')`,
 [token,teamId,actorId,raw.startOn,raw.count,digest(result.items)]);
 return {...result,token};
}
export async function confirmBatch(db:Client,actorId:string,raw:unknown){
 if(!raw||typeof raw!=="object"||Array.isArray(raw)||Object.keys(raw).length!==1||
 typeof (raw as {token?:unknown}).token!=="string")return {ok:false as const,error:"invalid-input" as const};
 const token=(raw as {token:string}).token;
 if(!/^[0-9a-f-]{36}$/.test(token))return {ok:false as const,error:"invalid-input" as const};
 await ensureBatchSchema(db);
 await db.query("BEGIN");
 try{
  const rows=await db.query<{team_id:string;actor_id:string;start_on:string;count:number;digest:string}>(`SELECT team_id,actor_id,start_on::text,count,digest
  FROM public.smn_sprint_batch_preview WHERE token=$1 AND consumed_at IS NULL AND expires_at>now() FOR UPDATE`,[token]);
  const saved=rows.rows[0];
  if(!saved||saved.actor_id!==actorId){await db.query("ROLLBACK");return {ok:false as const,error:"preview-expired" as const};}
  await db.query("SELECT pg_advisory_xact_lock(hashtext($1))",[saved.team_id]);
  const preview=await previewSprintBatch(db,{startOn:saved.start_on,count:saved.count});
  if(!preview.ok||!preview.valid||digest(preview.items)!==saved.digest){
   await db.query("ROLLBACK");return {ok:false as const,error:"stale-preview" as const};
  }
  const cadence=await db.query(`SELECT duration_weeks,start_day,start_time::text,end_day,end_time::text,time_zone,revision
   FROM public.smn_scrum_cadence WHERE team_id=$1`,[saved.team_id]);
  const created=[];
  for(const item of preview.items){
   const id=randomUUID();
   await db.query(`INSERT INTO public.smn_sprint
   (id,team_id,number,name,start_at,end_at,time_zone,created_by)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
   [id,saved.team_id,item.number,item.name,item.startAt,item.endAt,item.timeZone,actorId]);
   await db.query(`INSERT INTO public.smn_sprint_audit(id,sprint_id,action,actor_id,details)
   VALUES($1,$2,'created',$3,$4::jsonb)`,
   [randomUUID(),id,actorId,JSON.stringify({batchToken:token,number:item.number,name:item.name,startAt:item.startAt,endAt:item.endAt,timeZone:item.timeZone})]);
   await saveGeneratedCeremonies(db,{id,startAt:item.startAt,endAt:item.endAt,timeZone:item.timeZone},Number(cadence.rows[0].duration_weeks));
   created.push({id,number:item.number,name:item.name,startAt:item.startAt,endAt:item.endAt,timeZone:item.timeZone});
  }
  const auditId=randomUUID();
  await db.query(`INSERT INTO public.smn_sprint_batch_audit(id,team_id,actor_id,cadence,sprints)
   VALUES($1,$2,$3,$4::jsonb,$5::jsonb)`,
   [auditId,saved.team_id,actorId,JSON.stringify(cadence.rows[0]),JSON.stringify(created)]);
  await db.query("UPDATE public.smn_sprint_batch_preview SET consumed_at=now() WHERE token=$1",[token]);
  await db.query("COMMIT");
  return {ok:true as const,batchId:auditId,sprints:created};
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
export async function batchHistory(db:Client){
 await ensureBatchSchema(db);
 const teamId=await activeTeam(db);
 const r=await db.query(`SELECT id,actor_id,occurred_at::text AS occurred_at,team_id,cadence,sprints
 FROM public.smn_sprint_batch_audit WHERE team_id=$1 ORDER BY occurred_at DESC LIMIT 50`,[teamId]);
 return r.rows;
}
