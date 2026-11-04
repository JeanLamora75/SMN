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
