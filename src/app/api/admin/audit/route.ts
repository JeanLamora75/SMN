import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult} from "@/server/auth/request";
import {withAuthDb} from "@/server/auth/database";
import {readAuditJournal} from "@/server/audit/journal";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 const actor=await authorizeApi(request,"read",{type:"audit",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 try{
  const entries=await withAuthDb(client=>readAuditJournal(client));
  return jsonResult({entries});
 }catch{
  console.error("smn-audit-read-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
