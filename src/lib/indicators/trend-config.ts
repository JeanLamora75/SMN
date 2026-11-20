/** UI selection model for independently styled trend panels (maximum five). */
export type TrendChartStyle="bar"|"line"|"pie"|"donut"|"gauge"|"area";
export type TrendRow={key:number;indicatorId:string;style:TrendChartStyle};
type Indicator={id:string};
export const MAX_TREND_ROWS=5;
const styles:readonly TrendChartStyle[]=["bar","line","pie","donut","gauge","area"];
export function initialTrendRows(columns:readonly Indicator[]):TrendRow[]{
 return columns[0]?[{key:0,indicatorId:columns[0].id,style:"bar"}]:[];
}
export function nextTrendRow(rows:readonly TrendRow[],columns:readonly Indicator[]):TrendRow[]{
 if(rows.length>=MAX_TREND_ROWS)return [...rows];
 const next=columns.find(column=>!rows.some(row=>row.indicatorId===column.id));
 if(!next)return [...rows];
 return [...rows,{key:Math.max(-1,...rows.map(row=>row.key))+1,indicatorId:next.id,style:"bar"}];
}
export function validTrendRows(rows:readonly TrendRow[],columns:readonly Indicator[]):boolean{
 return rows.length>0&&rows.length<=MAX_TREND_ROWS&&
  new Set(rows.map(row=>row.indicatorId)).size===rows.length&&
  rows.every(row=>columns.some(column=>column.id===row.indicatorId)&&styles.includes(row.style));
}
