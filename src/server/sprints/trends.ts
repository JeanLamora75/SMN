import type {Client} from "pg";

export type SprintTrendPoint=Readonly<{
 sprintId:string;name:string;endAt:string;snapshotVersion:number|null;
 completedSp:number|null;completionRate:number|null;actualCapacityJh:number|null;
 completedSpQuality:"known"|"estimated"|"unqualified";
}>;
type Selected={id:string;team_id:string;start_at:string};
type Row={id:string;name:string;end_at:string;version:number;snapshot_data:unknown};
const object=(v:unknown):Record<string,unknown>|null=>
 v!==null&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:null;

/** Null and invalid values are not a numerical zero. */
function value(raw:unknown,integer:boolean):number|null{
 if(raw===null||raw===undefined)return null;
 if(typeof raw!=="string"&&typeof raw!=="number")return null;
 if(typeof raw==="string"&&(raw.trim()===""||!/^\d+(?:\.\d+)?$/.test(raw)))return null;
 const n=Number(raw);
 return Number.isFinite(n)&&n>=0&&n<=Number.MAX_SAFE_INTEGER&&
  (!integer||Number.isSafeInteger(n))?n:null;
}
export function projectSprintTrend(row:Row):SprintTrendPoint{
 const snapshot=object(row.snapshot_data);
 const points=object(snapshot?.storyPoints);
 const capacity=object(snapshot?.capacity);
 const initial=value(points?.initial_sp,true),added=value(points?.added_sp,true);
 const removed=value(points?.removed_sp,true);
 const completedSp=value(points?.done_sp,true);
 const final=initial!==null&&added!==null&&removed!==null?
  initial+added-removed:null;
 const completionRate=final!==null&&Number.isSafeInteger(final)&&
  final>0&&completedSp!==null?completedSp/final*100:null;
 const capacityJh=value(capacity?.actual_jh,false);
 const evidence=object(snapshot?.historicalMetricQualities);
 const declaredQuality=evidence?.SP_DONE;
 const completedSpQuality=declaredQuality==="known"||declaredQuality==="estimated"?declaredQuality:"unqualified";
 return {sprintId:row.id,name:row.name,endAt:row.end_at,
  snapshotVersion:Number.isSafeInteger(row.version)&&row.version>0?
   row.version:null,
  completedSp,completedSpQuality,completionRate:Number.isFinite(completionRate)?completionRate:null,
  actualCapacityJh:capacityJh};
}

/** Read at most six closure snapshots in the selected team, up to its start.
 * Reader is SELECT-only and safe inside a REPEATABLE READ READ ONLY transaction.
 * teamId is mandatory for user-facing collective projections; the optional
 * form preserves the older admin-only /api/admin/sprints/trends endpoint. */
export async function readSprintTrends(
 db:Client,selectedSprintId:string,teamId?:string
):Promise<SprintTrendPoint[]|null>{
 const selected=await db.query<Selected>(`
  SELECT s.id,s.team_id,s.start_at::text AS start_at FROM public.smn_sprint s
  JOIN public.smn_team t ON t.id=s.team_id
  JOIN public.smn_installation i ON i.id=t.installation_id
  WHERE s.id=$1 ${teamId?"AND s.team_id=$2":""}
   AND s.deleted_at IS NULL AND i.id='singleton'
   AND i.state='initialized' AND lower(COALESCE(NULLIF(to_jsonb(t)->>'agile_mode',''),i.mode))='scrum'
 `,teamId?[selectedSprintId,teamId]:[selectedSprintId]);
 const target=selected.rows[0];
 if(!target)return null;
 const installed=await db.query<{present:boolean}>(`
  SELECT to_regclass('public.smn_sprint_closure_snapshot') IS NOT NULL AS present`);
 if(!installed.rows[0]?.present)return [];
 const r=await db.query<Row>(`
  SELECT s.id,s.name,s.end_at::text AS end_at,
   latest.version,latest.snapshot AS snapshot_data
  FROM public.smn_sprint s
  JOIN LATERAL (
   SELECT v.version,v.snapshot FROM public.smn_sprint_closure_snapshot v
   WHERE v.sprint_id=s.id ORDER BY v.version DESC LIMIT 1
  ) latest ON true
  WHERE s.team_id=$1 AND s.deleted_at IS NULL AND s.status='closed'
   AND s.start_at<=$2::timestamptz
  ORDER BY s.start_at DESC,s.id DESC LIMIT 6
 `,[target.team_id,target.start_at]);
 return r.rows.reverse().map(projectSprintTrend);
}
