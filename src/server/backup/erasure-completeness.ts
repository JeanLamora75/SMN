import {createHmac} from "node:crypto";
import type {Client} from "pg";
import {erasureLedgerConfig,readErasureLedger} from "./erasure-ledger";
import {hasUnresolvedErasureIntent} from "./erasure-intent";
import {collectArchiveReviewInventory} from "./erasure-archive-review";
export type ErasureIntegrity=Readonly<{
 complete:boolean;checkedAt:string;reason:string;events:number
}>;
const deny=(reason:string,events=0):ErasureIntegrity=>({
 complete:false,checkedAt:new Date().toISOString(),reason,events
});
/** Application-level proof for releases AFTER journal enrollment only.
 * Privileged tampering and unmanaged external copies remain outside scope.
 * V1 markers without opaque subject IDs cannot establish completeness.
 */
export async function verifyErasureIntegrity(db:Pick<Client,"query">):Promise<ErasureIntegrity>{
 let count=0;
 try{
  const ledger=await readErasureLedger();count=ledger.markers.length;
  if(await hasUnresolvedErasureIntent())return deny("intent-unresolved",count);
  const guard=await db.query<{ready:boolean}>(
   "SELECT EXISTS(SELECT 1 FROM pg_catalog.pg_trigger t "+
   "WHERE t.tgrelid='public.smn_member'::regclass "+
   "AND t.tgname='smn40_member_delete_guard' "+
   "AND t.tgenabled IN ('O','A') "+
   "AND t.tgfoid=to_regprocedure('public.smn40_guard_member_delete()')) AS ready");
  if(guard.rows[0]?.ready!==true)return deny("member-guard-missing",count);
  const receipts=await db.query<{id:string;operation:string;committed_at:Date}>(
   "SELECT id::text,operation,committed_at "+
   "FROM public.smn_privacy_erasure_receipt "+
   "WHERE committed_at >= $1::timestamptz ORDER BY id",[ledger.coverageStart]);
  if(receipts.rows.length!==count)return deny("receipt-count-mismatch",count);
  const byId=new Map(receipts.rows.map(r=>[r.id,r]));
  if(byId.size!==count)return deny("receipt-duplicate",count);
  if(ledger.markers.some(m=>
   m.version!==2||!m.subjectToken||!byId.has(m.eventId)||
   byId.get(m.eventId)?.operation!==m.operation||
   new Date(byId.get(m.eventId)!.committed_at).toISOString()>m.occurredAt))
   return deny("subject-evidence-incomplete",count);
  const auditExists=await db.query<{present:boolean}>(
   "SELECT to_regclass('public.smn_member_removal_audit') IS NOT NULL AS present");
  if(auditExists.rows[0]?.present){
   const legacy=await db.query<{n:string}>(
    "SELECT count(*)::text AS n FROM public.smn_member_removal_audit "+
    "WHERE removed_at >= $1::timestamptz",[ledger.coverageStart]);
   if(legacy.rows[0]?.n!=="0")return deny("legacy-delete-unaccounted",count);
  }
  const config=erasureLedgerConfig();
  if(!config)return deny("ledger-unconfigured",count);
  try{
   const erased=new Set(ledger.markers.map(m=>m.subjectToken));
   const members=await db.query<{id:string}>(
    "SELECT id::text FROM public.smn_member WHERE installation_id='singleton'");
   for(const row of members.rows){
    const token=createHmac("sha256",config.key).update("smn-erased-member-v2|")
     .update(row.id).digest("hex");
    if(erased.has(token))return deny("erased-member-reintroduced",count);
   }
  }finally{config.key.fill(0);}
  // Without a verified human review and revocation of non-empty archives,
  // automatic qualification must remain blocked regardless of name searches.
  const inventory=await collectArchiveReviewInventory(
   db,process.env.SMN_PRIVATE_DOCUMENTS_DIR);
  if(inventory.candidates.length!==0)return deny("archive-review-required",count);
  return {complete:true,checkedAt:new Date().toISOString(),
   reason:"qualified-empty-archives-and-guarded-member-erasure",events:count};
 }catch{return deny("erasure-proof-unverifiable",count);}
}
