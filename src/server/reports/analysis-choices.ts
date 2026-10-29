import type {Client} from "pg";
import {readAnalysisJournal,type AnalysisJournalEntry} from "@/server/ai-briefs/journal";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function reportAnalysisCandidates(db:Client,sprintId:string){
 const scope=await db.query<{team_id:string}>(`SELECT s.team_id FROM public.smn_sprint s JOIN public.smn_team t ON t.id=s.team_id
 JOIN public.smn_installation i ON i.id=t.installation_id WHERE s.id=$1 AND s.deleted_at IS NULL AND i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum'`,[sprintId]);
 if(!scope.rows[0])return null;
 return readAnalysisJournal(db,scope.rows[0].team_id,{});
}
async function ensure(db:Client){
 await db.query("SELECT to_regclass('public.smn_report_analysis_choice') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("report-schema-not-ready: apply-report-schema-v32")});
}
export async function readReportAnalysisChoice(db:Client,sprintId:string){
 const existing=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_report_analysis_choice') IS NOT NULL AS present`);
 if(!existing.rows[0]?.present)return [] as string[];
 const r=await db.query<{selected_ids:unknown}>(`SELECT selected_ids FROM public.smn_report_analysis_choice WHERE sprint_id=$1`,[sprintId]);
 const x=r.rows[0]?.selected_ids;
 return Array.isArray(x)?x.filter((id):id is string=>typeof id==="string"&&/^(human|ai):[a-f0-9-]{36}$/i.test(id)):[];
}
export async function saveReportAnalysisChoice(db:Client,sprintId:string,ids:unknown){
 if(!Array.isArray(ids)||ids.length>100||!ids.every(x=>typeof x==="string"&&/^(human|ai):[a-f0-9-]{36}$/i.test(x)))return {ok:false as const,error:"invalid-input"};
 const candidates=await reportAnalysisCandidates(db,sprintId);
 if(!candidates)return {ok:false as const,error:"not-found"};
 const allowed=new Set(candidates.map(item=>item.type+":"+item.id));
 if(ids.some(x=>!allowed.has(x)))return {ok:false as const,error:"not-authorized-or-unavailable"};
 await ensure(db);
 await db.query(`INSERT INTO public.smn_report_analysis_choice(sprint_id,selected_ids) VALUES($1,$2::jsonb)
 ON CONFLICT(sprint_id) DO UPDATE SET selected_ids=EXCLUDED.selected_ids,updated_at=now()`,[sprintId,JSON.stringify([...new Set(ids)])]);
 return {ok:true as const};
}
export async function selectedReportAnalyses(db:Client,sprintId:string):Promise<AnalysisJournalEntry[]>{
 const ids=await readReportAnalysisChoice(db,sprintId);
 if(!ids.length)return [];
 const candidates=await reportAnalysisCandidates(db,sprintId);
 if(!candidates)return [];
 const byKey=new Map(candidates.map(entry=>[entry.type+":"+entry.id,entry]));
 return ids.map(id=>byKey.get(id)).filter((x):x is AnalysisJournalEntry=>!!x);
}
