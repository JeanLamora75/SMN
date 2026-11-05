/** Display-only fill fractions, left to right. No KPI values are derived. */
export function batterySegmentFills(ratio:number,count=6):number[]{
 if(!Number.isSafeInteger(count)||count<1||count>24)throw Error("dashboard-battery-count-invalid");
 const progress=Number.isFinite(ratio)?Math.max(0,Math.min(1,ratio)):0;
 return Array.from({length:count},(_,i)=>Math.min(1,Math.max(0,progress*count-i)));
}
