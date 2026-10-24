import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {readKanbanTiming,saveKanbanTiming} from "@/server/kanban/timing";
export const dynamic="force-dynamic";
const resource={type:"collective",exists:true,inScope:true} as const;
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!await authorizeApi(request,"read",resource))return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 try{const data=await withAuthDb(db=>readKanbanTiming(db,id));return data?jsonResult(data):jsonResult({error:"not-found"},404);}
 catch{return jsonResult({error:"service-unavailable"},503);}
}
export async function PUT(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(request);
 if(!input)return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{const result=await withAuthDb(db=>saveKanbanTiming(db,actor.id,id,input));
 return result.ok?jsonResult(result):jsonResult(result,result.error==="closed-period"?409:result.error==="not-found"?404:400);}
 catch{return jsonResult({error:"service-unavailable"},503);}
}
