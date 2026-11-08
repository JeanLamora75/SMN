import {NextRequest,NextResponse} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {validChartStyleConfig,validChartType} from "@/server/reports/chart-style-contract";
import {renderAdaptiveChartPng} from "../../../../../../../scripts/smn-412-adaptive-chart.mjs";

export const runtime="nodejs";
export const dynamic="force-dynamic";

/** Fixed synthetic data. Never query indicators, teams, actual reports or archives. */
export const PREVIEW_CYCLES=Object.freeze(["S1","S2","S3","S4","S5","S6"].map(name=>Object.freeze({name})));
export const PREVIEW_SERIES=Object.freeze([
 Object.freeze({name:"Livré",unit:"SP",values:Object.freeze([8,12,10,16,14,19])}),
 Object.freeze({name:"Prévu",unit:"SP",values:Object.freeze([13,14,16,18,17,21])})
]);
export async function POST(req:NextRequest){
 const actor=await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const raw=await readJsonObject(req,12000);
 if(!raw||!validChartType(raw.type)||!validChartStyleConfig(raw.config)||
  (raw.locale!==undefined&&raw.locale!=="fr"&&raw.locale!=="en")||
  Object.keys(raw).some(key=>key!=="type"&&key!=="config"&&key!=="locale"))
  return jsonResult({error:"invalid-input"},400);
 const type=raw.type;
 const locale=raw.locale==="en"?"en":"fr";
 try{
  const png=renderAdaptiveChartPng({
   target:{widthEmu:960*3048,heightEmu:560*3048},
   cycles:PREVIEW_CYCLES,series:type==="gauge"?[{
    name:locale==="en"?"Progress":"Avancement",unit:"%",values:[38,44,56,65,70,76]
   }]:PREVIEW_SERIES.map((series,i)=>({...series,
    name:locale==="en"?(i===0?"Delivered":"Planned"):series.name,values:[...series.values]})),
   type,locale,style:raw.config
  });
  if(!png||png.length>2_000_000)return jsonResult({error:"preview-unavailable"},422);
  return new NextResponse(new Uint8Array(png),{status:200,headers:{
   "Content-Type":"image/png","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff",
   "Content-Disposition":"inline; filename=\"chart-preview.png\""
  }});
 }catch(error){
  const code=error instanceof Error&&error.message.startsWith("office-chart-")?
   error.message:"preview-unavailable";
  return jsonResult({error:code},422);
 }
}
