import {assertKanbanSchema} from "./schema-ready";
import type {Client} from "pg";
import {readAnalysisJournal} from "@/server/ai-briefs/journal";
export async function kanbanAnalysisCandidates(db:Client,periodId:string){
 const scope=await db.query<{team_id:string}>(`SELECT p.team_id FROM public.smn_kanban_period p
 JOIN public.smn_team t ON t.id=p.team_id JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE p.id=$1 AND p.deleted_at IS NULL AND i.id='singleton' AND i.state='initialized'
 AND lower(i.mode)='kanban'`,[periodId]);
 if(scope.rows.length!==1)return null;
 return readAnalysisJournal(db,scope.rows[0].team_id,{});
}
export async function readKanbanAnalysisIds(db:Client,periodId:string):Promise<string[]>{
 const exists=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_kanban_report_analysis_choice') IS NOT NULL AS present`);
 if(!exists.rows[0]?.present)return [];
 const result=await db.query<{selected_ids:unknown}>(`SELECT selected_ids FROM public.smn_kanban_report_analysis_choice WHERE period_id=$1`,[periodId]);
 return Array.isArray(result.rows[0]?.selected_ids)?(result.rows[0].selected_ids as unknown[]).filter((v):v is string=>typeof v==="string"&&/^(human|ai):[a-f0-9-]{36}$/i.test(v)):[];
}
export async function selectedKanbanAnalyses(db:Client,periodId:string){
 const ids=await readKanbanAnalysisIds(db,periodId);
 if(ids.length===0)return [];
 const candidates=await kanbanAnalysisCandidates(db,periodId);
 if(!candidates)return [];
 const index=new Map(candidates.map(x=>[x.type+":"+x.id,x]));
 return ids.map(id=>index.get(id)).filter((v):v is NonNullable<typeof v>=>!!v);
}
export async function saveKanbanAnalyses(db:Client,periodId:string,raw:unknown){
 if(!Array.isArray(raw)||raw.length>100||raw.some(x=>typeof x!=="string"||!/^(human|ai):[a-f0-9-]{36}$/i.test(x)))return {ok:false as const,error:"invalid-input"};
 const candidates=await kanbanAnalysisCandidates(db,periodId);
 if(!candidates)return {ok:false as const,error:"not-found"};
 const allowed=new Set(candidates.map(x=>x.type+":"+x.id));
 if(raw.some(x=>!allowed.has(x)))return {ok:false as const,error:"not-authorized"};
 await assertKanbanSchema(db,"smn_kanban_report_analysis_choice");
 await db.query(`INSERT INTO public.smn_kanban_report_analysis_choice(period_id,selected_ids)
 VALUES($1,$2::jsonb) ON CONFLICT(period_id) DO UPDATE SET selected_ids=EXCLUDED.selected_ids,updated_at=now()`,[periodId,JSON.stringify([...new Set(raw)])]);
 return {ok:true as const};
}
