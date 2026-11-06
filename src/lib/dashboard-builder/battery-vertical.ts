import {batterySegmentFills} from "./battery-horizontal";

/** Visual-only segment fills ordered top to bottom; the filled portion rises from the base. */
export function verticalBatteryFills(ratio:number,count=6):number[]{
 return batterySegmentFills(ratio,count).reverse();
}
