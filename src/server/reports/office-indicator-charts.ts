import type {ReportData} from "@/server/indicators/reporting";
import {trendNumbers,validateTrendSelection} from "@/lib/indicators/trend-series";
import {renderOfficeTrendPng} from "../../../scripts/smn-402-trend-png.mjs";

type ChartOptions={last:number;type:"bar"|"line"|"area";tags:string[]|null};

/** Reuses the same v33 trend projection, including frozen sprint closures. */
export function renderOfficeIndicatorChart(report:ReportData,cycleId:string,
 options:ChartOptions,locale:"fr"|"en"):Buffer|null{
 const index=report.cycles.findIndex(cycle=>cycle.id===cycleId);
 if(index<0)throw Error("office-chart-cycle-not-found");
 const columns=options.tags?options.tags.map(tag=>{
  const column=report.columns.find(c=>c.tag.toUpperCase()===tag.toUpperCase());
  if(!column)throw Error("office-chart-indicator-unavailable");
  return column;
 }):report.columns.slice(0,1);
 if(columns.length===0)return null;
 const error=validateTrendSelection(columns.map(c=>c.id),report.columns);
 if(error!==null)throw Error("office-chart-"+error);
 const cycles=report.cycles.slice(Math.max(0,index-options.last+1),index+1);
 const series=columns.map(column=>({
  name:column.name,tag:column.tag,
  values:trendNumbers(cycles,column.id)
 }));
 return renderOfficeTrendPng({
  cycles:cycles.map(cycle=>({name:cycle.name})),series,
  type:options.type,language:locale
 });
}
