/** Date window where an effective-dated revision actually determines role capacity.
 * Revisions on the same day are resolved by the highest revision number.
 * A correction of a shadowed revision cannot affect live capacity.
 */
export type DatedRevision=Readonly<{revision:number;effective_from:string}>;
export type RevisionImpact=Readonly<{start:string;end:string|null}>;

export function revisionImpactWindow(
 versions:readonly DatedRevision[],target:DatedRevision,assignmentEnd:string|null
):RevisionImpact|null{
 const sameDayWinner=Math.max(...versions.filter(v=>v.effective_from===target.effective_from)
  .map(v=>v.revision));
 if(sameDayWinner>target.revision)return null;
 const next=versions.filter(v=>v.effective_from>target.effective_from)
  .map(v=>v.effective_from).sort()[0];
 const nextEnd=next?new Date(Date.parse(next+"T00:00:00.000Z")-86400000)
  .toISOString().slice(0,10):null;
 const end=assignmentEnd&&nextEnd?
  (assignmentEnd<nextEnd?assignmentEnd:nextEnd):assignmentEnd??nextEnd;
 if(end!==null&&end<target.effective_from)return null;
 return {start:target.effective_from,end};
}

/** Cancellation can skip frozen-period checks only when the immediately
 * applicable revision after removing the target has identical capacity inputs.
 * Comparing the actual percentage columns prevents accidental historical drift.
 */
export type CapacityRevision=DatedRevision&Readonly<{
 contract_percent:number;allocation_percent:number;contribution_percent:number;
 scrum_master_percent:number;product_owner_percent:number;developer_percent:number;
}>;
export function isCapacityNeutralCancellation(
 versions:readonly CapacityRevision[],target:CapacityRevision
):boolean{
 const remaining=versions.filter(v=>v.revision!==target.revision&&
  v.effective_from<=target.effective_from);
 const predecessor=remaining.sort((a,b)=>
  a.effective_from.localeCompare(b.effective_from)||a.revision-b.revision).at(-1);
 if(!predecessor)return false;
 return (["contract_percent","allocation_percent","contribution_percent",
  "scrum_master_percent","product_owner_percent","developer_percent"] as const)
  .every(key=>Number(predecessor[key])===Number(target[key]));
}

/** Inform-only read: historical corrections never mutate frozen KPI snapshots.
 * The user may explicitly reopen a closed sprint and close it again to recapture.
 */
export async function countAffectedClosedSprints(
 db:import("pg").Client,teamId:string,impact:RevisionImpact|null
):Promise<number>{
 if(!impact)return 0;
 const result=await db.query<{count:string}>(`
 SELECT COUNT(*)::text AS count FROM public.smn_sprint s
 WHERE s.team_id=$1 AND s.deleted_at IS NULL AND s.status='closed'
  AND (s.start_at AT TIME ZONE s.time_zone)::date<=COALESCE($3::date,'infinity'::date)
  AND (s.end_at AT TIME ZONE s.time_zone)::date>=$2::date`,
 [teamId,impact.start,impact.end]);
 return Number(result.rows[0]?.count??0);
}
