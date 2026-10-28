import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {certifyNationalYear,readAnnualValidationDiagnostic}
 from "@/server/holidays/annual-validation";
import {isValidCountry} from "@/server/members/location";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const target={type:"settings",exists:true,inScope:true} as const;
type Scope={params:Promise<{code:string}>};
function yearFromQuery(req:NextRequest):number|null{
 const value=req.nextUrl.searchParams.get("year");
 if(!value||!/^\d{4}$/.test(value))return null;
 const year=Number(value);return year>=1900&&year<=2200?year:null;
}
/** Read-only diagnostic, without implicitly certifying the year. */
export async function GET(req:NextRequest,{params}:Scope){
 const actor=await authorizeApi(req,"read",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {code}=await params,year=yearFromQuery(req);
 if(!isValidCountry(code)||year===null)return jsonResult({error:"invalid-input"},400);
 try{
  const diagnostic=await withAuthDb(db=>readAnnualValidationDiagnostic(db,code,year));
  if(!diagnostic)return jsonResult({error:"country-not-found"},404);
  return jsonResult({diagnostic});
 }catch{
  console.error("smn-year-diagnostic-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
/** Only explicit admin confirmation may attest annual national completeness. */
export async function POST(req:NextRequest,{params}:Scope){
 const actor=await authorizeApi(req,"write",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {code}=await params;
 if(!isValidCountry(code))return jsonResult({error:"invalid-input"},400);
 const body=await readJsonObject(req);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>certifyNationalYear(db,code,actor.id,body));
  if(!result.ok)return jsonResult(result,
   result.error==="invalid-input"?400:
   result.error==="country-not-found"?404:
   result.error==="conflict"?409:422);
  return jsonResult(result);
 }catch{
  console.error("smn-year-validation-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
