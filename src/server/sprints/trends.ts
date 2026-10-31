import {readSprintDetailIndicators} from "./indicators-read";
import {readSavedCapacityKpis} from "./sprint-capacity-kpis";
import type {Client} from "pg";

export type SprintTrendPoint=Readonly<{
 sprintId:string;name:string;endAt:string;snapshotVersion:number|null;
 completedSp:number|null;completionRate:number|null;actualCapacityJh:number|null;
 completedSpQuality:"known"|"estimated"|"unqualified";
}>;
type Selected={id:string;team_id:string;start_at:string};
type Row={id:string;name:string;end_at:string;status:string};
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
export function projectSprintTrend(row:Pick<Row,"id"|"name"|"end_at"> & {version:number;snapshot_data:unknown}):SprintTrendPoint{
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

/** Lecture des six cycles au plus, tous statuts confondus et limités à l'équipe.
 * Les cycles clôturés lisent uniquement leur snapshot Vn, les autres leurs
 * indicateurs courants. Aucun indicateur absent n'est remplacé par zéro. */
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
 const selectedRows=await db.query<Row>(`
  SELECT s.id,s.name,s.end_at::text AS end_at,s.status
  FROM public.smn_sprint s
  WHERE s.team_id=$1 AND s.deleted_at IS NULL
   AND (s.start_at,s.id)<=($2::timestamptz,$3)
  ORDER BY s.start_at DESC,s.id DESC LIMIT 6
 `,[target.team_id,target.start_at,target.id]);
 const rows=selectedRows.rows.reverse();
 const result:SprintTrendPoint[]=[];
 for(const row of rows){
  if(row.status==="closed"){
   const snapshot=await db.query<{version:number;snapshot:unknown}>(`
    SELECT version,snapshot FROM public.smn_sprint_closure_snapshot
    WHERE sprint_id=$1 ORDER BY version DESC LIMIT 1`,[row.id]);
   const latest=snapshot.rows[0];
   if(latest){
    result.push(projectSprintTrend({id:row.id,name:row.name,end_at:row.end_at,
     version:latest.version,snapshot_data:latest.snapshot}));
    continue;
   }
  }
  if(row.status==="closed"){
   result.push({sprintId:row.id,name:row.name,endAt:row.end_at,snapshotVersion:null,
    completedSp:null,completionRate:null,actualCapacityJh:null,
    completedSpQuality:"unqualified"});
   continue;
  }
  const indicator=await readSprintDetailIndicators(db,target.team_id,row.id);
  const points=indicator?.state==="available"&&indicator.points.state==="available"?
   indicator.points.values:null;
  const initial=value(points?.initial,true),added=value(points?.added,true);
  const removed=value(points?.removed,true),completedSp=value(points?.done,true);
  const total=initial!==null&&added!==null&&removed!==null?
   initial+added-removed:null;
  const rate=total!==null&&total>0&&completedSp!==null?
   completedSp/total*100:null;
  const capacity=await readSavedCapacityKpis(db,row.id);
  result.push({sprintId:row.id,name:row.name,endAt:row.end_at,
   snapshotVersion:null,completedSp,completedSpQuality:"unqualified",
   completionRate:rate!==null&&Number.isFinite(rate)?rate:null,
   actualCapacityJh:capacity?.actual_jh??null});
 }
 return result;
}
