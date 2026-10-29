import type {Client} from "pg";
import {validHistoryDepth} from "./history-trends";
export async function readReportHistoryOptions(db:Client,sprintId:string){
 const exists=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_report_history_options') IS NOT NULL AS present`);
 if(!exists.rows[0]?.present)return {depth:5,revision:0};
 const result=await db.query<{depth:number;revision:number}>(`SELECT depth,revision FROM public.smn_report_history_options WHERE sprint_id=$1`,[sprintId]);
 return result.rows[0]??{depth:5,revision:0};
}
export async function saveReportHistoryOptions(db:Client,sprintId:string,actorId:string,input:unknown){
 if(!/^[a-f0-9-]{36}$/i.test(sprintId)||!input||typeof input!=="object"||Array.isArray(input))return {ok:false as const,error:"invalid-input"};
 const v=input as Record<string,unknown>;
 if(Object.keys(v).sort().join(",")!=="depth,revision"||!validHistoryDepth(v.depth)||!Number.isSafeInteger(v.revision)||Number(v.revision)<0)return {ok:false as const,error:"invalid-input"};
 await db.query("BEGIN");
 try{
 const scope=await db.query(`SELECT s.id FROM public.smn_sprint s JOIN public.smn_team t ON t.id=s.team_id
 JOIN public.smn_installation i ON i.id=t.installation_id WHERE s.id=$1 AND s.deleted_at IS NULL
 AND i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum' FOR UPDATE OF s`,[sprintId]);
 if(scope.rows.length!==1){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
 await db.query("SELECT to_regclass('public.smn_report_history_options') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("report-schema-not-ready: apply-report-schema-v32")});
 const prior=await db.query<{revision:number}>(`SELECT revision FROM public.smn_report_history_options WHERE sprint_id=$1 FOR UPDATE`,[sprintId]);
 if((prior.rows[0]?.revision??0)!==v.revision){await db.query("ROLLBACK");return {ok:false as const,error:"conflict"};}
 const next=Number(v.revision)+1;
 await db.query(`INSERT INTO public.smn_report_history_options(sprint_id,depth,revision,updated_by) VALUES($1,$2,$3,$4)
 ON CONFLICT(sprint_id) DO UPDATE SET depth=EXCLUDED.depth,revision=EXCLUDED.revision,
 updated_by=EXCLUDED.updated_by,updated_at=now()`,[sprintId,v.depth,next,actorId]);
 await db.query("COMMIT");return {ok:true as const,revision:next};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
