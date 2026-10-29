import type {Client} from "pg";
import {defaultTeamContextOptions,validTeamContextOptions} from "@/lib/report-team-context";
export async function readTeamContextChoices(db:Client,sprintId:string){
 const r=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_report_team_context_options') IS NOT NULL AS present`);
 if(!r.rows[0]?.present)return {options:defaultTeamContextOptions(),revision:0};
 const v=await db.query<{options:unknown;revision:number}>(`SELECT options,revision FROM public.smn_report_team_context_options WHERE sprint_id=$1`,[sprintId]);
 if(!v.rows[0])return {options:defaultTeamContextOptions(),revision:0};
 if(!validTeamContextOptions(v.rows[0].options))throw Error("invalid-report-team-context-options");
 return {options:v.rows[0].options,revision:v.rows[0].revision};
}
export async function saveTeamContextChoices(db:Client,sprintId:string,actorId:string,raw:unknown){
 if(!/^[a-f0-9-]{36}$/i.test(sprintId)||!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false as const,error:"invalid-input"};
 const input=raw as Record<string,unknown>;
 if(Object.keys(input).sort().join(",")!=="options,revision"||!validTeamContextOptions(input.options)||!Number.isSafeInteger(input.revision)||Number(input.revision)<0)return {ok:false as const,error:"invalid-input"};
 await db.query("BEGIN");
 try{
  const scope=await db.query(`SELECT s.id FROM public.smn_sprint s JOIN public.smn_team t ON t.id=s.team_id
 JOIN public.smn_installation i ON i.id=t.installation_id WHERE s.id=$1 AND s.deleted_at IS NULL AND
 i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum' FOR UPDATE OF s`,[sprintId]);
  if(scope.rows.length!==1){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  await db.query("SELECT to_regclass('public.smn_report_team_context_options') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("report-schema-not-ready: apply-report-schema-v32")});
  const old=await db.query<{revision:number}>(`SELECT revision FROM public.smn_report_team_context_options WHERE sprint_id=$1 FOR UPDATE`,[sprintId]);
  if((old.rows[0]?.revision??0)!==input.revision){await db.query("ROLLBACK");return {ok:false as const,error:"conflict"};}
  const revision=Number(input.revision)+1;
  await db.query(`INSERT INTO public.smn_report_team_context_options(sprint_id,options,revision,updated_by)
 VALUES($1,$2::jsonb,$3,$4) ON CONFLICT(sprint_id) DO UPDATE SET options=EXCLUDED.options,revision=EXCLUDED.revision,
 updated_by=EXCLUDED.updated_by,updated_at=now()`,[sprintId,JSON.stringify(input.options),revision,actorId]);
  await db.query("COMMIT");return {ok:true as const,revision};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
