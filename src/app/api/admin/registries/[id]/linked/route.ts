import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {createRegistryItem} from "@/server/registries/items";
import {parseLinkedJournalCreation} from "@/lib/registry-linked-creation";

export const dynamic="force-dynamic";
export const runtime="nodejs";

/** Source ID comes exclusively from the authorized route, never from editable form data.
 * Creation, revision one, relation audit and idempotency key share one transaction.
 */
export async function POST(req:NextRequest,{params}:{
 params:Promise<{id:string}>
}){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req,16384);
 const parsed=parseLinkedJournalCreation(body);
 if(!parsed)return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 const {requestId,...fields}=parsed;
 try{
  const result=await withLegacyTeamApi(db=>
   createRegistryItem(db,actor.id,{...fields,sourceId:id},requestId));
  return jsonResult(result,result.ok?201:
   result.error==="conflict"?409:result.error==="not-found"?404:400);
 }catch(error){
  console.error("smn-registry-linked-create-unavailable",
   error instanceof Error?error.name:"unknown");
  return jsonResult({error:"service-unavailable"},503);
 }
}
