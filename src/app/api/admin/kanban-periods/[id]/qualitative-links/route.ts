import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {readKanbanLinkChoices,changeKanbanQualitativeLink} from "@/server/kanban/qualitative";
export const dynamic="force-dynamic";
const scope={type:"collective",exists:true,inScope:true} as const;
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"read",scope);
 if(!actor)return jsonResult({error:"forbidden"},403);
 // Candidate registry lists are restricted to admins to avoid leaking sensitive notes.
 if(actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 try{const result=await withAuthDb(db=>readKanbanLinkChoices(db,id));
 return result?jsonResult(result):jsonResult({error:"not-found"},404);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",scope);
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const raw=await readJsonObject(req);
 if(!raw)return jsonResult({error:"invalid-input"},400);
 try{const result=await withAuthDb(db=>changeKanbanQualitativeLink(db,actor.id,id,raw));
 return result.ok?jsonResult(result):jsonResult(result,result.error==="not-found"?404:result.error==="invalid-input"?400:409);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
