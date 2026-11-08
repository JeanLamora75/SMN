import type {ReportData} from "@/server/indicators/reporting";
import {trendNumbers,validateTrendSelection} from "@/lib/indicators/trend-series";
import {renderOfficeTrendPng} from "../../../scripts/smn-402-trend-png.mjs";
import {renderAdaptiveChartPng} from "../../../scripts/smn-412-adaptive-chart.mjs";

type ChartOptions={last:number;type:"bar"|"line"|"area"|"pie"|"donut"|"gauge";tags:string[]|null};
/** A chart tag must match an indicator enabled and visible in the team's Trends screen. */
export class OfficeChartIndicatorUnavailableError extends Error{
 constructor(public readonly tag:string){
  super("office-chart-indicator-unavailable");
  this.name="OfficeChartIndicatorUnavailableError";
 }
}


/** The same v33 report projection supplies the old Word and new PPTX renderers. */
function selectOfficeIndicatorSeries(report:ReportData,cycleId:string,options:ChartOptions){
 const index=report.cycles.findIndex(cycle=>cycle.id===cycleId);
 if(index<0)throw Error("office-chart-cycle-not-found");
 const columns=options.tags?options.tags.map(tag=>{
  const column=report.columns.find(c=>c.tag.toUpperCase()===tag.toUpperCase());
  if(!column)throw new OfficeChartIndicatorUnavailableError(tag);
  return column;
 }):report.columns.slice(0,1);
 if(columns.length===0)return null;
 if(options.type==="gauge"&&columns.length!==1)throw Error("office-chart-gauge-one-series");
 const error=validateTrendSelection(columns.map(c=>c.id),report.columns);
 if(error!==null)throw Error("office-chart-"+error);
 const cycles=report.cycles.slice(Math.max(0,index-options.last+1),index+1);
 return {
  cycles:cycles.map(cycle=>({name:cycle.name})),
  series:columns.map(column=>({
   name:column.name,tag:column.tag,unit:column.unit,
   values:trendNumbers(cycles,column.id)
  }))
 };
}

/** Legacy DOCX renderer remains unchanged for pre-existing Word templates. */
export function renderOfficeIndicatorChart(report:ReportData,cycleId:string,
 options:ChartOptions,locale:"fr"|"en"):Buffer|null{
 const selected=selectOfficeIndicatorSeries(report,cycleId,options);
 if(!selected)return null;
 return renderOfficeTrendPng({...selected,type:options.type,language:locale});
}

export function renderOfficeIndicatorAdaptiveChart(report:ReportData,cycleId:string,
 options:ChartOptions,locale:"fr"|"en",target:{widthEmu:number;heightEmu:number}):Buffer|null{
 const selected=selectOfficeIndicatorSeries(report,cycleId,options);
 if(!selected)return null;
 return renderAdaptiveChartPng({...selected,target,type:options.type,locale});
}
