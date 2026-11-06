/** SMN-394: direction denotes the sign of the current KPI, never a historical delta. */
export type TrendDirection="up"|"flat"|"down";
export function trendDirection(value:number):TrendDirection|null{
 if(!Number.isFinite(value))return null;
 return value>0?"up":value<0?"down":"flat";
}
