import type {TicketBrowseRow} from "./ticket-csv-browse";

/** Exact decimal representation: never silently coerce an empty/invalid SP to zero. */
export type TicketStoryPointSummary=Readonly<{
 sum:string|null;
 numericCount:number;
 missingCount:number;
 invalidCount:number;
}>;
export type TicketGroupCount=Readonly<{value:string;count:number;storyPoints:TicketStoryPointSummary}>;
export type TicketSummary=Readonly<{
 ticketCount:number;
 completedCount:number;
 storyPoints:TicketStoryPointSummary;
 byType:TicketGroupCount[];
 byStatus:TicketGroupCount[];
 byPrefix:TicketGroupCount[];
}>;
export type TicketSummaryScopes=Readonly<{
 all:TicketSummary;
 filtered:TicketSummary;
}>;

type Decimal=Readonly<{coefficient:bigint;scale:number}>;
function parseDecimal(raw:string):Decimal|null{
 const value=raw.trim();
 const match=/^([+-]?)(?:(\d+)(?:[.,](\d+))?|[.,](\d+))$/.exec(value);
 if(!match)return null;
 const decimal=match[3]??match[4]??"";
 const whole=match[2]??"0";
 const coefficient=BigInt(whole+decimal)*(match[1]==="-"?-1n:1n);
 return {coefficient,scale:decimal.length};
}
function formatDecimal(coefficient:bigint,scale:number):string{
 const negative=coefficient<0n;
 const abs=(negative?-coefficient:coefficient).toString().padStart(scale+1,"0");
 if(!scale)return (negative?"-":"")+abs;
 const point=abs.length-scale;
 const fraction=abs.slice(point).replace(/0+$/,"");
 return (negative?"-":"")+abs.slice(0,point)+(fraction?"."+fraction:"");
}
function sumStoryPoints(decimals:readonly Decimal[]):string|null{
 if(!decimals.length)return null;
 const maxScale=decimals.reduce((max,item)=>Math.max(max,item.scale),0);
 const total=decimals.reduce((sum,item)=>
  sum+item.coefficient*10n**BigInt(maxScale-item.scale),0n);
 return formatDecimal(total,maxScale);
}
function summarizePoints(rows:readonly TicketBrowseRow[]):TicketStoryPointSummary{
 const decimals:Decimal[]=[];
 let missingCount=0,invalidCount=0;
 for(const row of rows){
  if(!row.storyPoints.trim()){missingCount++;continue;}
  const parsed=parseDecimal(row.storyPoints);
  if(parsed===null){invalidCount++;continue;}
  decimals.push(parsed);
 }
 return {
  sum:sumStoryPoints(decimals),numericCount:decimals.length,missingCount,invalidCount,
 };
}
function countBy(rows:readonly TicketBrowseRow[],field:"issueType"|"status"|"prefix"):TicketGroupCount[]{
 const counts=new Map<string,TicketBrowseRow[]>();
 for(const row of rows){
  const value=row[field].trim();
  const group=counts.get(value)??[];
  group.push(row);
  counts.set(value,group);
 }
 return [...counts].sort((a,b)=>b[1].length-a[1].length||
  a[0].localeCompare(b[0],"fr",{sensitivity:"base",numeric:true}))
  .map(([value,group])=>({value,count:group.length,storyPoints:summarizePoints(group)}));
}

/** Pure and reusable by Consultation and future Word/PPT reports. */
export function summarizeTicketRows(rows:readonly TicketBrowseRow[]):TicketSummary{
 let completedCount=0;
 for(const row of rows)if(row.completed)completedCount++;
 return {
  ticketCount:rows.length,completedCount,
  storyPoints:summarizePoints(rows),
  byType:countBy(rows,"issueType"),
  byStatus:countBy(rows,"status"),
  byPrefix:countBy(rows,"prefix"),
 };
}
