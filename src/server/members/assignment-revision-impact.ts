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
