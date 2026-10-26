import type {DashboardMetric} from "./dashboard-data-contract";

export type StoryPointsPerJh=Readonly<
 {state:"available";value:number}|
 {state:"not-recorded"}|
 {state:"unavailable"}|
 {state:"not-calculable"}
>;

/** Collective ratio of recorded SP to retained J/H for the SAME Sprint.
 * Does not apply member weights or reconstruct capacity from present-day data. */
export function dashboardStoryPointsPerJh(
 points:DashboardMetric|undefined,capacity:DashboardMetric|undefined
):StoryPointsPerJh{
 if(points?.state==="unavailable"||capacity?.state==="unavailable")
  return {state:"unavailable"};
 if(points?.state!=="available"||capacity?.state!=="available")
  return {state:"not-recorded"};
 if(!Number.isFinite(points.value)||!Number.isFinite(capacity.value)||
  points.value<0||capacity.value<=0)return {state:"not-calculable"};
 const value=points.value/capacity.value;
 return Number.isFinite(value)?{state:"available",value}:{state:"not-calculable"};
}
