import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {authorizeRegistryRecord} from "@/server/registries/scoped-record";
import {jsonResult} from "@/server/auth/request";
import {readRegistryComments} from "@/server/registries/comments";
import {readRegistryJournalLinks} from "@/server/registries/journal-links";

export const dynamic="force-dynamic";
export const runtime="nodejs";

/** One read-only snapshot for the journal; lack of comment tables is not an error.
 * No technical revision audit is projected into the business timeline.
 */
export async function GET(req:NextRequest,{params}:{
 params:Promise<{id:string}>
}){
 const actor=await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 try{
  const result=await withSprintIndexDb(async db=>{
   if(!await authorizeRegistryRecord(db,{accountId:actor.id,role:actor.role},id))return null;
   const comments=await readRegistryComments(db,id,actor.role==="admin");
   if(!comments)return null;
   const events=await readRegistryJournalLinks(db,id,actor.role==="admin");
   return {...comments,events};
  });
  return jsonResult(result??{error:"not-found"},result?200:404);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
