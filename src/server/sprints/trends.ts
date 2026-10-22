import type {Client} from "pg";
import {ensureStoryPointsSchema} from "./story-points";

export type SprintTrendPoint={
 sprintId:string;name:string;endAt:string;
 completedSp:number|null;completionRate:number|null;actualCapacityJh:number|null
};

/** Read only persisted, closed snapshots. Never read unsaved client data. */
export async function readSprintTrends(db:Client,selectedSprintId:string):Promise<SprintTrendPoint[]|null>{
 await ensureStoryPointsSchema(db);
 const selected=await db.query<{id:string;team_id:string;start_at:string}>(`SELECT s.id,s.team_id,s.start_at::text FROM public.smn_sprint s
 JOIN public.smn_team t ON t.id=s.team_id JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE s.id=$1 AND s.deleted_at IS NULL AND i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum'`,[selectedSprintId]);
 const target=selected.rows[0];
 if(!target)return null;
 // Bound by the selected Sprint's chronological beginning, even when the target is open.
 const r=await db.query<{
  id:string;name:string;end_at:string;initial_sp:string|null;added_sp:string|null;
  removed_sp:string|null;done_sp:string|null;actual_jh:number|null;
 }>(`SELECT s.id,s.name,s.end_at::text,
 sp.initial_sp::text,sp.added_sp::text,sp.removed_sp::text,sp.done_sp::text,
 snap.retained_jh::float8 AS actual_jh
 FROM public.smn_sprint s
 LEFT JOIN public.smn_sprint_story_points sp ON sp.sprint_id=s.id
 LEFT JOIN public.smn_capacity_period_override p ON p.team_id=s.team_id
  AND p.start_on=(s.start_at AT TIME ZONE s.time_zone)::date
  AND p.end_on=(s.end_at AT TIME ZONE s.time_zone)::date
 LEFT JOIN public.smn_capacity_actual_snapshot snap ON snap.period_id=p.id
 WHERE s.team_id=$1 AND s.deleted_at IS NULL AND s.status='closed'
 AND s.start_at<=$2::timestamptz
 ORDER BY s.start_at DESC,s.id DESC LIMIT 5`,[target.team_id,target.start_at]);
 return r.rows.reverse().map(x=>{
  const initial=x.initial_sp===null?null:Number(x.initial_sp);
  const added=x.added_sp===null?null:Number(x.added_sp);
  const removed=x.removed_sp===null?null:Number(x.removed_sp);
  const completedSp=x.done_sp===null?null:Number(x.done_sp);
  const final=initial!==null&&added!==null&&removed!==null?initial+added-removed:null;
  return {sprintId:x.id,name:x.name,endAt:x.end_at,completedSp,
   completionRate:final!==null&&final>0&&completedSp!==null?completedSp/final*100:null,
   actualCapacityJh:x.actual_jh===null?null:Number(x.actual_jh)};
 });
}
