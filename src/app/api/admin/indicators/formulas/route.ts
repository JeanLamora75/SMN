import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {previewFormula,publishFormula,FormulaPublicationError} from "@/server/indicators/formula-publication";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"settings",exists:true,inScope:true} as const;
export async function POST(req:NextRequest){
 const actor=await authorizeApi(req,"write",resource);
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req,10000);
 if(!body)return jsonResult({error:"invalid-input"},400);
 if(typeof body.indicatorId!=="string"||typeof body.formula!=="string")return jsonResult({error:"invalid-input"},400);
 const proposal={indicatorId:body.indicatorId,formula:body.formula};
 try{
  if(body.action==="preview"&&Object.keys(body).length===3)
   return jsonResult(await withAuthDb(db=>previewFormula(db,proposal)),200);
  if(body.action==="publish"&&Object.keys(body).length===4&&body.confirmation&&typeof body.confirmation==="object"&&!Array.isArray(body.confirmation)){
   const c=body.confirmation as Record<string,unknown>;
   if(Object.keys(c).length!==2||typeof c.globalRevision!=="string"||typeof c.fingerprint!=="string")
    return jsonResult({error:"invalid-input"},400);
   const result=await withAuthDb(db=>publishFormula(db,proposal,{globalRevision:c.globalRevision as string,fingerprint:c.fingerprint as string}));
   return jsonResult(result,result.ok?200:result.error==="stale_preview"?409:result.error==="not_found"?404:422);
  }
  return jsonResult({error:"invalid-input"},400);
 }catch(e){
  if(e instanceof FormulaPublicationError)return jsonResult({error:e.code},e.code==="not_found"?404:422);
  console.error("indicator-formula-publication-failed");
  return jsonResult({error:"service-unavailable"},503);
 }
}
