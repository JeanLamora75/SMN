import type {Client} from "pg";
import {projectSprintTrend,type SprintTrendPoint} from "@/server/sprints/trends";
export const MAX_REPORT_TREND_CYCLES=5;
export function validHistoryDepth(value:unknown):value is number{
 return Number.isSafeInteger(value)&&typeof value==="number"&&value>=1&&value<=MAX_REPORT_TREND_CYCLES;
}
/** Historic reports anchor to the selected Sprint's start, never to today. */
export async function readReportTrends(db:Client,sprintId:string,depth:number):Promise<SprintTrendPoint[]|null>{
 if(!validHistoryDepth(depth))throw Error("invalid-history-depth");
 const context=await db.query<{teamId:string;startAt:string}>(`SELECT s.team_id AS "teamId",s.start_at::text AS "startAt"
 FROM public.smn_sprint s JOIN public.smn_team t ON t.id=s.team_id
 JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE s.id=$1 AND s.deleted_at IS NULL AND i.id='singleton'
 AND i.state='initialized' AND lower(i.mode)='scrum'`,[sprintId]);
 const target=context.rows[0];if(!target)return null;
 const schema=await db.query<{exists:boolean}>(`SELECT to_regclass('public.smn_sprint_closure_snapshot') IS NOT NULL AS exists`);
 if(!schema.rows[0]?.exists)return [];
 const r=await db.query<{id:string;name:string;end_at:string;version:number;snapshot_data:unknown}>(`
 SELECT s.id,s.name,s.end_at::text AS end_at,history.version,history.snapshot AS snapshot_data
 FROM public.smn_sprint s
 JOIN LATERAL (SELECT v.version,v.snapshot FROM public.smn_sprint_closure_snapshot v
 WHERE v.sprint_id=s.id ORDER BY v.version DESC LIMIT 1) history ON true
 WHERE s.team_id=$1 AND s.deleted_at IS NULL AND s.status='closed'
 AND s.start_at<=$2::timestamptz AND s.end_at<=$3::timestamptz
 ORDER BY s.start_at DESC,s.id DESC LIMIT $4`,[target.teamId,target.startAt,target.startAt,depth]);
 return r.rows.reverse().map(projectSprintTrend);
}
