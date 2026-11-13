import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {readJsonObject} from "@/server/auth/request";
import {readJiraConfig,writeJiraConfig,JiraConfigError} from "@/server/tickets/jira-config";

export const dynamic="force-dynamic";
export const runtime="nodejs";
const headers={"Cache-Control":"no-store"};
export async function GET(request:NextRequest){
 const actor=await authorizeApi(request,"read",{type:"collective",exists:true,inScope:true});
 if(!actor)return Response.json({error:"forbidden"},{status:403,headers});
 try{return Response.json({settings:await readJiraConfig()},{headers});}
 catch{return Response.json({error:"service-unavailable"},{status:503,headers});}
}
export async function PATCH(request:NextRequest){
 const actor=await authorizeApi(request,"write",{type:"settings",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")return Response.json({error:"forbidden"},{status:403,headers});
 const body=await readJsonObject(request,8192);
 if(!body)return Response.json({error:"invalid-input"},{status:400,headers});
 try{return Response.json(await writeJiraConfig(body),{headers});}
 catch(e){
  const code=e instanceof JiraConfigError?e.code:"service-unavailable";
  return Response.json({error:code},{status:code==="conflict"?409:code==="invalid-input"?400:503,headers});
 }
}
