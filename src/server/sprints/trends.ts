import type {Client} from "pg";
import {ensureClosureSchema} from "./closure";

export type SprintTrendPoint={
 sprintId:string;name:string;endAt:string;
 completedSp:number|null;completionRate:number|null;actualCapacityJh:number|null
};

/** Read only persisted, closed snapshots. Never read unsaved client data. */
export async function readSprintTrends(db:Client,selectedSprintId:string):Promise<SprintTrendPoint[]|null>{
 await ensureClosureSchema(db);
 const selected=await db.query<{id:string;team_id:string;start_at:string}>(`SELECT s.id,s.team_id,s.start_at::text FROM public.smn_sprint s
 JOIN public.smn_team t ON t.id=s.team_id JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE s.id=$1 AND s.deleted_at IS NULL AND i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum'`,[selectedSprintId]);
 const target=selected.rows[0];
 if(!target)return null;
 // Bound by the selected Sprint's chronological beginning, even when the target is open.
 const r=await db.query<{id:string;name:string;end_at:string;snapshot_data:unknown}>(`SELECT s.id,s.name,s.end_at::text,latest.snapshot AS snapshot_data
 FROM public.smn_sprint s
 JOIN LATERAL (SELECT snapshot FROM public.smn_sprint_closure_snapshot v
 WHERE v.sprint_id=s.id ORDER BY version DESC LIMIT 1) latest ON true
 WHERE s.team_id=$1 AND s.deleted_at IS NULL AND s.status='closed'
 AND s.start_at<=$2::timestamptz
 ORDER BY s.start_at DESC,s.id DESC LIMIT 5`,[target.team_id,target.start_at]);
 return r.rows.reverse().map(x=>{
  const snapshot=x.snapshot_data as {storyPoints?:{initial_sp?:string|null;added_sp?:string|null;removed_sp?:string|null;done_sp?:string|null}|null;capacity?:{actual_jh?:string|null}|null}|null;
  const saved=snapshot?.storyPoints;
  const initial=saved? (saved.initial_sp==null?null:Number(saved.initial_sp)):null;
  const added=saved?(saved.added_sp==null?null:Number(saved.added_sp)):null;
  const removed=saved?(saved.removed_sp==null?null:Number(saved.removed_sp)):null;
  const completedSp=saved?(saved.done_sp==null?null:Number(saved.done_sp)):null;
  const final=initial!==null&&added!==null&&removed!==null?initial+added-removed:null;
  return {sprintId:x.id,name:x.name,endAt:x.end_at,completedSp,
   completionRate:final!==null&&final>0&&completedSp!==null?completedSp/final*100:null,
   actualCapacityJh:snapshot?.capacity?.actual_jh==null?null:Number(snapshot.capacity.actual_jh)};
 });
}
