import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {jsonResult} from "@/server/auth/request";
import {prepareSprintReport} from "@/server/reports/sprint-preparation";
export const dynamic="force-dynamic";export const runtime="nodejs";
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true}))
 return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 if(!/^[a-f0-9-]{36}$/i.test(id))return jsonResult({error:"invalid-input"},400);
 try{const data=await withSprintIndexDb(db=>prepareSprintReport(db,id));
 return jsonResult(data??{error:"not-found"},data?200:404);}
 catch{return jsonResult({error:"service-unavailable"},503);}
}
