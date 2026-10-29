import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {withAuthDb} from "@/server/auth/database";
import {listTemplates,saveTemplate} from "@/server/sprints/ceremony-templates";
export const dynamic="force-dynamic";
const target={type:"settings",exists:true,inScope:true} as const;
export async function GET(req:NextRequest){
 const actor=await authorizeApi(req,"read",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 try{return jsonResult(await withAuthDb(async db=>{
  const teamId=req.nextUrl.searchParams.get("teamId");
  const templates=await listTemplates(db,{accountId:actor.id,role:actor.role},teamId);
  return {teamId,templates};
 }));}catch{return jsonResult({error:"unavailable"},503);}
}
export async function POST(req:NextRequest){
 const actor=await authorizeApi(req,"write",target);if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req);if(!body)return jsonResult({error:"invalid-input"},400);
 const {teamId,...input}=body;
 if(teamId!==undefined&&typeof teamId!=="string")return jsonResult({error:"invalid-input"},400);
 try{const result=await withAuthDb(db=>saveTemplate(db,actor.id,input,teamId as string|undefined));return jsonResult(result,result.ok?200:result.error==="conflict"?409:400);}
 catch{return jsonResult({error:"unavailable"},503);}
}
