import {NextRequest,NextResponse} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {jsonResult} from "@/server/auth/request";
import {readPrivateBriefArchive} from "@/server/ai-briefs/library";

export const dynamic="force-dynamic";export const runtime="nodejs";
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 try{
  const result=await withLegacyTeamApi(async db=>{
   const team=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t
   JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode) IN ('scrum','kanban')`);
   if(team.rows.length!==1)return {state:"not-found" as const};
   return readPrivateBriefArchive(db,id,team.rows[0].id);
  });
  if(result.state==="not-found")return jsonResult({error:"not-found"},404);
  if(result.state==="integrity-error")return jsonResult({error:"integrity-error"},409);
  const filename="smn-brief-"+id+".txt";
  return new NextResponse(result.text,{status:200,headers:{
   "Content-Type":"text/plain; charset=utf-8",
   "Content-Disposition":`attachment; filename="${filename}"`,
   "Cache-Control":"private, no-store",
   "X-Content-Type-Options":"nosniff"
  }});
 }catch{return jsonResult({error:"unavailable"},503);}
}
