/** Pure geometries: original KPI value remains unchanged; ratio is presentation-only. */
export const RING_RADIUS=74;
export function ringProgress(ratio:number,radius=RING_RADIUS){
 if(!Number.isFinite(ratio)||ratio<0||ratio>1||!Number.isFinite(radius)||radius<=0)throw Error("dashboard-ring-invalid");
 const circumference=2*Math.PI*radius,filled=circumference*ratio;
 return {circumference,filled,dashOffset:circumference-filled};
}
/** Ticks are distributed clockwise from the top of the ring. */
export function ringTicks(count=24){
 if(!Number.isSafeInteger(count)||count<1||count>120)throw Error("dashboard-ring-ticks-invalid");
 return Array.from({length:count},(_,i)=>{
  const angle=-Math.PI/2+i*2*Math.PI/count;
  return {x1:100+87*Math.cos(angle),y1:100+87*Math.sin(angle),
   x2:100+94*Math.cos(angle),y2:100+94*Math.sin(angle)};
 });
}
