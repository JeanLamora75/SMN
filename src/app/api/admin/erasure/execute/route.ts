import {NextRequest} from "next/server";
import {Client} from "pg";
import {authorizeApi} from "@/server/auth/authorization";
import {installedDatabaseUri} from "@/server/auth/database";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {verifyImpactReceipt} from "@/server/backup/erasure-plan-token";
import {previewMemberErasure} from "@/server/backup/erasure-preview";
import {inspectRestrictedMemberErasure,eraseRestrictedMember}
 from "@/server/backup/erasure-restricted-member";
import {inspectDependentMemberErasure,eraseDependentMember}
 from "@/server/backup/erasure-dependent-member";
export const runtime="nodejs";
export const dynamic="force-dynamic";

/**
 * SMN-39: strictly bounded scopes are isolated provisional members or
 * provisional members with ONLY unreferenced role assignments and versions.
 * Members with cycles, reports, history or ambiguous files are blocked.
 *
 * The receipt is signed server-side, bound to this active admin session,
 * short-lived, and freshly checked against the source data/files. A separate
 * typed confirmation is mandatory; no force bypass is accepted.
 */
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",{
  type:"backups",exists:true,inScope:true
 });
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(request,2048);
 if(!body||Object.keys(body).sort().join(",")!==
  "acknowledgeExternalCopies,confirmation,token"||
  typeof body.token!=="string"||body.token.length>1500||
  typeof body.confirmation!=="string"||
  body.acknowledgeExternalCopies!==true)
  return jsonResult({error:"invalid-input"},400);
 const receipt=verifyImpactReceipt(body.token,actor.id);
 if(!receipt||receipt.mode!=="erase"||
  body.confirmation!=="EFFACER "+receipt.planId)
  return jsonResult({error:"invalid-or-expired-plan"},409);
 try{
  const preview=await previewMemberErasure(receipt.memberId,"erase");
  if(!preview.scopeRevision||preview.scopeRevision!==receipt.scopeRevision)
   return jsonResult({error:"plan-stale-or-unverifiable"},409);
  const uri=await installedDatabaseUri();
  const db=new Client({
   connectionString:uri,connectionTimeoutMillis:3500,
   statement_timeout:15000,query_timeout:15000,
   application_name:"smn-exceptional-restricted-erasure"
  });
  try{
   await db.connect();
   const restricted=await inspectRestrictedMemberErasure(db,receipt.memberId);
   let scope:"unreferenced-provisional-only"|"role-assignments-without-cycles";
   let executed:{receiptId:string;affectedRows:number;recorded:true};
   if(restricted.eligible){
    scope="unreferenced-provisional-only";
    executed=await eraseRestrictedMember(db,{
     memberId:receipt.memberId,scopeRevision:receipt.scopeRevision
    });
   }else{
    const dependent=await inspectDependentMemberErasure(db,receipt.memberId);
    if(!dependent.eligible)
     return jsonResult({error:"dependent-scope-not-qualified"},409);
    scope="role-assignments-without-cycles";
    executed=await eraseDependentMember(db,{
     memberId:receipt.memberId,scopeRevision:receipt.scopeRevision
    });
   }
   return jsonResult({status:"erased",scope,
    receiptId:executed.receiptId,affectedRows:executed.affectedRows,
    externalCopiesNotControlled:true},200);
  }finally{await db.end().catch(()=>undefined);}
 }catch{
  // Do not reveal identities, database URLs, filesystem contents or full SQL.
  // If COMMIT was ambiguous the external pending intent remains fail-closed.
  return jsonResult({error:"erasure-blocked-or-outcome-unresolved",
   restorePermitted:false},409);
 }
}
