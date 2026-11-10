import {NextRequest,NextResponse} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {readChartStyles} from "@/server/reports/chart-style-store";
import {validChartType,validChartStyleId,validChartStyleConfig} from "@/server/reports/chart-style-contract";
import {renderAdaptiveChartPng} from "../../../../../../../scripts/smn-412-adaptive-chart.mjs";

export const runtime="nodejs";
export const dynamic="force-dynamic";

type Series={name:string;unit:string;values:(number|null)[]};
const safeLabel=(v:unknown)=>typeof v==="string"&&v.length<=160&&!/[<>\x00-\x1f]/.test(v);
export function validTrendRenderRequest(raw:unknown):raw is {
 type:"bar"|"line"|"area"|"pie"|"donut"|"gauge";styleId:string;
 locale:"fr"|"en";cycles:{name:string}[];series:Series[];
}{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return false;
 const o=raw as Record<string,unknown>;
 if(Object.keys(o).some(k=>!["type","styleId","locale","cycles","series"].includes(k))||
  !validChartType(o.type)||!validChartStyleId(o.styleId)||!["fr","en"].includes(o.locale as string)||
  !Array.isArray(o.cycles)||o.cycles.length<1||o.cycles.length>24||
  !o.cycles.every(c=>c&&typeof c==="object"&&!Array.isArray(c)&&Object.keys(c).length===1&&safeLabel(c.name))||
  !Array.isArray(o.series)||o.series.length<1||o.series.length>6||
  !o.series.every(s=>s&&typeof s==="object"&&!Array.isArray(s)&&
   Object.keys(s).length===3&&safeLabel(s.name)&&safeLabel(s.unit)&&Array.isArray(s.values)&&
   s.values.length===(o.cycles as unknown[]).length&&s.values.every((v:unknown)=>v===null||
    typeof v==="number"&&Number.isFinite(v)&&Math.abs(v)<=1e10)))return false;
 return true;
}
/**
 * Receives only display-ready values previously retrieved by the existing
 * authorized trends endpoint. This endpoint never reads business data.
 * The server authorizes access to the renderer and checks style visibility.
 */
export async function POST(req:NextRequest){
 const actor=await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req,14000);
 if(!validTrendRenderRequest(body))return jsonResult({error:"invalid-input"},400);
 try{
  const catalog=await withAuthDb(db=>readChartStyles(db,{id:actor.id,role:actor.role}));
  const style=catalog.styles.find(s=>s.id===body.styleId);
  if(!style||!validChartStyleConfig(style.config))return jsonResult({error:"style-not-found"},404);
  const png=renderAdaptiveChartPng({
   cycles:body.cycles,series:body.series,type:body.type,locale:body.locale,style:style.config,
   target:{widthEmu:960*3048,heightEmu:560*3048}
  });
  if(!png||png.length>8*1024*1024)return jsonResult({error:"chart-unavailable"},422);
  return new NextResponse(new Uint8Array(png),{headers:{
   "Content-Type":"image/png","Cache-Control":"private, no-store",
   "X-Content-Type-Options":"nosniff","Content-Disposition":"inline; filename=\"smn-trends.png\""
  }});
 }catch(e){
  if(e instanceof Error&&e.message.startsWith("office-chart-"))return jsonResult({error:"invalid-chart"},422);
  return jsonResult({error:"chart-unavailable"},503);
 }
}
