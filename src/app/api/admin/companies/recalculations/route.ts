import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult} from "@/server/auth/request";
import {processCompanyRecalculation} from "@/server/capacity/company-recalc-worker";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"companies",exists:true,inScope:true} as const;
/** Admin-only manual replay for jobs after a temporary failure. */
export async function POST(request:NextRequest){
 if(!await authorizeApi(request,"write",resource))return jsonResult({error:"forbidden"},403);
 try{
  const r=await withAuthDb(async db=>{
   const v=await db.query<{schema_version:number}>("SELECT schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'");
   if(v.rows[0]?.schema_version!==31)throw Error("schema-not-ready");
   return processCompanyRecalculation(db);
  });
  return jsonResult(r);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
export async function GET(request:NextRequest){
 if(!await authorizeApi(request,"read",resource))return jsonResult({error:"forbidden"},403);
 const companyId=request.nextUrl.searchParams.get("companyId");
 if(!companyId||!/^[a-f0-9-]{36}$/i.test(companyId))return jsonResult({error:"invalid-input"},400);
 try{
  const jobs=await withAuthDb(async db=>{
   const exists=await db.query<{exists:boolean}>("SELECT to_regclass('public.smn_company_capacity_recalc') IS NOT NULL AS exists");
   if(!exists.rows[0]?.exists)return [];
   const r=await db.query<{id:string;status:string;attempts:number;last_error:string|null;result:unknown}>(`SELECT id,status,attempts,last_error,result
    FROM public.smn_company_capacity_recalc
    WHERE company_id=$1 ORDER BY created_at DESC LIMIT 30`,[companyId]);
   return r.rows;
  });
  return jsonResult({jobs});
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
