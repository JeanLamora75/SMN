import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult} from "@/server/auth/request";
import {withSessionReadDb} from "@/server/auth/database";
import {collectArchiveReviewInventory} from "@/server/backup/erasure-archive-review";
export const runtime="nodejs";
export const dynamic="force-dynamic";
/**
 * Confidential, read-only inventory for Administrator review.
 * No "approve all", no automatic clearance and no file content in response.
 * An empty/failed inventory cannot be supplied by the browser as a proof.
 */
export async function GET(request:NextRequest){
 const actor=await authorizeApi(request,"read",{
  type:"backups",exists:true,inScope:true
 });
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 try{
  const inventory=await withSessionReadDb(db=>
   collectArchiveReviewInventory(db,process.env.SMN_PRIVATE_DOCUMENTS_DIR));
  return jsonResult({inventory,reviewRequired:inventory.candidates.length>0,
   reviewComplete:false,executionPermitted:false});
 }catch{
  return jsonResult({error:"archive-review-unverifiable",
   reviewComplete:false,executionPermitted:false},503);
 }
}
