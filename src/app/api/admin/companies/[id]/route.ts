import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {getCompany,changeCompany,setCompanyArchived} from "@/server/companies/catalog";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"companies",exists:true,inScope:true} as const;
type Ctx={params:Promise<{id:string}>};
export async function GET(request:NextRequest,{params}:Ctx){
 if(!await authorizeApi(request,"read",resource))return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 try{const company=await withAuthDb(db=>getCompany(db,id));
 return company?jsonResult({company}):jsonResult({error:"not-found"},404);}
 catch{return jsonResult({error:"service-unavailable"},503);}
}
export async function PATCH(request:NextRequest,{params}:Ctx){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {id}=await params;const body=await readJsonObject(request);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{const result=await withAuthDb(db=>changeCompany(db,id,actor.id,body));
 if(result.ok)return jsonResult(result);
 return jsonResult({error:result.error},result.error==="not-found"?404:
  ["conflict","duplicate-name","already-archived"].includes(result.error)?409:400);}
 catch{return jsonResult({error:"service-unavailable"},503);}
}
export async function POST(request:NextRequest,{params}:Ctx){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {id}=await params;const body=await readJsonObject(request);
 if(!body||!["archive","reactivate"].includes(String(body.action)))return jsonResult({error:"invalid-input"},400);
 if(Object.keys(body).length!==2||Object.keys(body).some(k=>!["action","revision"].includes(k)))return jsonResult({error:"invalid-input"},400);
 try{const result=await withAuthDb(db=>setCompanyArchived(db,id,actor.id,body.revision,body.action==="archive"));
 if(result.ok)return jsonResult(result);
 return jsonResult({error:result.error},result.error==="not-found"?404:
  result.error==="invalid-input"?400:409);}
 catch{return jsonResult({error:"service-unavailable"},503);}
}
