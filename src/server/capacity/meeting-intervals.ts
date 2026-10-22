/** Interval calculus for capacity-impacting meetings.
 * Time is UTC milliseconds, never civil-clock arithmetic across DST.
 * Do not infer working hours from calendar half-day booleans.
 */
export type Interval={start:number;end:number};
export function unionDurationMinutes(intervals:readonly Interval[],bounds:Interval):number{
 if(!Number.isFinite(bounds.start)||!Number.isFinite(bounds.end)||bounds.end<=bounds.start)throw Error("invalid-bounds");
 const clipped=intervals.map(i=>{
  if(!Number.isFinite(i.start)||!Number.isFinite(i.end)||i.end<i.start)throw Error("invalid-interval");
  return {start:Math.max(i.start,bounds.start),end:Math.min(i.end,bounds.end)};
 }).filter(i=>i.end>i.start).sort((a,b)=>a.start-b.start||a.end-b.end);
 let minutes=0,start=0,end=0;
 for(const i of clipped){
  if(i.start>end){minutes+=Math.max(0,end-start);start=i.start;end=i.end;}
  else end=Math.max(end,i.end);
 }
 return (minutes+Math.max(0,end-start))/60000;
}
export type Contribution={allocationPercent:number;developerPercent:number;contributionPercent:number};
export function capacityImpactJh(meetingMinutes:number,hoursPerJh:number,c:Contribution):number{
 if(!Number.isFinite(meetingMinutes)||meetingMinutes<0||!Number.isFinite(hoursPerJh)||hoursPerJh<=0||
 [c.allocationPercent,c.developerPercent,c.contributionPercent].some(v=>!Number.isFinite(v)||v<0||v>100))
 throw Error("invalid-capacity-impact");
 return meetingMinutes/(60*hoursPerJh)*(c.allocationPercent/100)*(c.developerPercent/100)*(c.contributionPercent/100);
}
