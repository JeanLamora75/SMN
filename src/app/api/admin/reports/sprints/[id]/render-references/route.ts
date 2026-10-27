import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {createFrozenReportReference} from "@/server/reports/render-reference";
export const runtime="nodejs";
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return Response.json({error:"forbidden"},{status:403});
 const {id}=await params;
 if(!/^[a-f0-9-]{36}$/i.test(id))return Response.json({error:"invalid-input"},{status:400});
 try{
 const ref=await withLegacyTeamApi(db=>createFrozenReportReference(db,id,actor.id));
 return ref?Response.json({id:ref.id,sha256:ref.sha256,createdAt:ref.createdAt},{status:201}):Response.json({error:"not-found"},{status:404});
 }catch{return Response.json({error:"unavailable"},{status:503});}
}
