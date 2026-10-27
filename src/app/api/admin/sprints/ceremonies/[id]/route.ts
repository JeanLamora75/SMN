import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {ceremonyHistory,editCeremony} from "@/server/sprints/ceremony-edits";
export const dynamic="force-dynamic";
type Context={params:Promise<{id:string}>};
export async function PATCH(req:NextRequest,ctx:Context){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req);
 if(!body)return jsonResult({error:"invalid-input"},400);
 const {id}=await ctx.params;
 try{const result=await withLegacyTeamApi(db=>editCeremony(db,actor.id,id,body));
 return jsonResult(result,result.ok?200:result.error==="conflict"?409:result.error==="not-found"?404:400);}
 catch{return jsonResult({error:"unavailable"},503);}
}
export async function GET(req:NextRequest,ctx:Context){
 if(!await authorizeApi(req,"read",{type:"settings",exists:true,inScope:true}))return jsonResult({error:"forbidden"},403);
 const {id}=await ctx.params;
 try{return jsonResult({history:await withLegacyTeamApi(db=>ceremonyHistory(db,id))});}
 catch{return jsonResult({error:"unavailable"},503);}
}
