import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {ChartStyleError} from "@/server/reports/chart-style-contract";
import {readChartStyles,applyChartStyleCommand} from "@/server/reports/chart-style-store";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const scope={type:"settings",exists:true,inScope:true} as const;
function failure(e:unknown){
 if(e instanceof ChartStyleError){
  const status=e.code==="forbidden"?403:e.code==="not-found"?404:
   ["conflict","protected-style","default-style","schema-not-ready"].includes(e.code)?409:400;
  return jsonResult({error:e.code},status);
 }
 console.error("chart-styles-service-unavailable");
 return jsonResult({error:"service-unavailable"},503);
}
export async function GET(req:NextRequest){
 const actor=await authorizeApi(req,"read",scope);
 if(!actor)return jsonResult({error:"forbidden"},403);
 try{return jsonResult(await withAuthDb(db=>readChartStyles(db,{id:actor.id,role:actor.role})),200);}
 catch(e){return failure(e);}
}
export async function POST(req:NextRequest){
 const actor=await authorizeApi(req,"write",scope);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const raw=await readJsonObject(req,16000);
 if(!raw)return jsonResult({error:"invalid-input"},400);
 try{return jsonResult(await withAuthDb(db=>applyChartStyleCommand(db,{id:actor.id,role:actor.role},raw)),200);}
 catch(e){return failure(e);}
}
