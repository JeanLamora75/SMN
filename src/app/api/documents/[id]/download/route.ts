import {NextRequest,NextResponse} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {readCollectiveDashboard,validRecordId} from "@/server/dashboard/read";
import {readPrivateDocument} from "@/server/documents/private-file";
export const dynamic="force-dynamic";
const denied=()=>NextResponse.json({error:"not-found"},{status:404,headers:{
 "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"
}});
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(request,"read",{type:"collective",exists:true,inScope:true});
 if(!actor)return denied();
 const {id}=await params;
 if(!validRecordId(id))return denied();
 try{
  const dashboard=await withAuthDb(readCollectiveDashboard);
  const file=await readPrivateDocument(process.env.SMN_PRIVATE_DOCUMENTS_DIR,id,dashboard.context.teamId,actor);
  if(!file)return denied();
  const type=file.format==="PDF"?"application/pdf":"text/plain; charset=utf-8";
  return new NextResponse(Uint8Array.from(file.body).buffer,{status:200,headers:{
   "Content-Type":type,
   "Content-Disposition":`attachment; filename="${file.downloadName}"`,
   "Cache-Control":"private, no-store",
   "X-Content-Type-Options":"nosniff",
   "Content-Security-Policy":"default-src 'none'",
  }});
 }catch{
  console.error("smn-private-document-read-unavailable");
  return denied();
 }
}
