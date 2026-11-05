/** Presentation-only normalization: never infer KPI targets or clamp out-of-range values. */
export function resolveTachometerRatio(value:number,minimum:unknown,maximum:unknown):number|null {
 if(typeof minimum!=="number"||typeof maximum!=="number"||
  !Number.isFinite(value)||!Number.isFinite(minimum)||!Number.isFinite(maximum)||
  minimum>=maximum||value<minimum||value>maximum)return null;
 return (value-minimum)/(maximum-minimum);
}

/** Semi-circle runs from left (minimum) through top to right (maximum). */
export function tachometerNeedle(ratio:number):{x:number;y:number}{
 const angle=Math.PI*ratio;
 return {x:130-96*Math.cos(angle),y:128-96*Math.sin(angle)};
}
