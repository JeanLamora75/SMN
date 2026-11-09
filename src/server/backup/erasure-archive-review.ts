import {createHash} from "node:crypto";
import type {Client} from "pg";
import {inspectExtraArchives} from "./extra-archives";
import {scanDocuments} from "./files";

/**
 * Every managed archive is represented by a SHA-256 fingerprint. No filename,
 * text, identity or private document content is returned to the caller.
 *
 * This is an inventory for an authorized HUMAN content review; it is not
 * machine proof that a scanned PDF/image/embedded OOXML object is anonymous.
 */
export type ArchiveCandidate=Readonly<{
 fingerprint:string;kind:"pdf"|"office-report"|"office-template"|"private-file";
 sha256:string;bytes:number;filename?:string;
 inspection:"human-review-required";
}>;
export type ArchiveReviewInventory=Readonly<{
 capturedAt:string;inventorySha256:string;complete:boolean;
 candidates:readonly ArchiveCandidate[];
}>;
const SHA=/^[0-9a-f]{64}$/;
const hash=(value:string)=>createHash("sha256").update(value).digest("hex");
const MAX=1200;
export function assembleArchiveReview(
 records:readonly {kind:ArchiveCandidate["kind"];sha256:string;bytes:number;filename?:string}[],
 capturedAt=new Date().toISOString()
):ArchiveReviewInventory{
 if(!Number.isFinite(Date.parse(capturedAt))||
  new Date(capturedAt).toISOString()!==capturedAt||
  records.length>MAX||records.some(r=>!SHA.test(r.sha256)||
   !Number.isSafeInteger(r.bytes)||r.bytes<1||
   (r.filename!==undefined&&(r.filename.length>220||
    /[\\/\x00-\x1f]/.test(r.filename)))))
  throw Error("privacy-review-inventory-invalid");
 const candidates=records.map(r=>({
  ...r,fingerprint:hash(r.kind+"|"+r.sha256+"|"+r.bytes+"|"+(r.filename??"")),
  inspection:"human-review-required" as const
 })).sort((a,b)=>a.fingerprint.localeCompare(b.fingerprint));
 if(new Set(candidates.map(c=>c.fingerprint)).size!==candidates.length)
  throw Error("privacy-review-inventory-duplicate");
 return {capturedAt,
  inventorySha256:hash(candidates.map(c=>c.fingerprint).join("|")),
  complete:true,candidates};
}
/**
 * Read-only inventory, with DB-SHA and filesystem-integrity checks provided
 * by existing backup scanners. If a store is absent or corrupt, throw;
 * NEVER report zero files as proof of a successful review.
 */
export async function collectArchiveReviewInventory(
 db:Pick<Client,"query">,privateRoot:string|undefined
):Promise<ArchiveReviewInventory>{
 if(!privateRoot)throw Error("privacy-review-private-store-unconfigured");
 const extra=await inspectExtraArchives(db);
 const privateFiles=await scanDocuments(privateRoot);
 return assembleArchiveReview([
  ...extra.pdf.map(v=>({kind:"pdf" as const,sha256:v.hash,bytes:v.size,filename:v.name})),
  ...extra.office.map(v=>({kind:"office-report" as const,sha256:v.hash,bytes:v.size,filename:v.name})),
  ...extra.templates.map(v=>({kind:"office-template" as const,sha256:v.hash,bytes:v.size,filename:v.name})),
  ...privateFiles.map(v=>({kind:"private-file" as const,sha256:v.hash,bytes:v.length,filename:v.name}))
 ]);
}
export type ArchiveReviewDecision=Readonly<{
 fingerprint:string;originalSha256:string;
 action:"restrict-original"|"replace-with-redacted-version"|"preserve";
 reviewedBy:string;reviewedAt:string;
 verifiedAccessRestriction:boolean;verifiedReplacement:boolean;
 riskOfReidentification:"excluded"|"possible"|"unknown";
}>;
export type ArchiveReviewOutcome=Readonly<{
 permitted:boolean;
 unresolved:readonly string[];inventorySha256:string;
}>;
/**
 * Fail-closed policy: no UI-supplied "force" switch.
 * A review can clear an archive only after server evidence confirms that
 * the original can no longer be accessed through the managed application,
 * or that a distinct redacted version replaced it AND old access is revoked.
 * Human approval by itself never proves archive safety.
 */
export function assessArchiveReview(inventory:ArchiveReviewInventory,
 decisions:readonly ArchiveReviewDecision[],now=new Date()):ArchiveReviewOutcome{
 const unresolved:string[]=[];
 const byId=new Map(decisions.map(d=>[d.fingerprint,d]));
 if(!inventory.complete||decisions.length!==inventory.candidates.length||
  byId.size!==decisions.length||!Number.isFinite(now.getTime())||
  inventory.candidates.length>MAX)
  return {permitted:false,unresolved:["review-incomplete"],inventorySha256:inventory.inventorySha256};
 for(const item of inventory.candidates){
  const decision=byId.get(item.fingerprint);
  if(!decision||decision.originalSha256!==item.sha256||
   typeof decision.reviewedBy!=="string"||!decision.reviewedBy.trim()||
   !Number.isFinite(Date.parse(decision.reviewedAt))||
   new Date(decision.reviewedAt).toISOString()!==decision.reviewedAt||
   decision.reviewedAt<inventory.capturedAt||
   decision.reviewedAt>now.toISOString()||
   decision.riskOfReidentification!=="excluded"||
   decision.verifiedAccessRestriction!==true||
   decision.action==="preserve"||
   (decision.action==="replace-with-redacted-version"&&
    decision.verifiedReplacement!==true)||
   !["restrict-original","replace-with-redacted-version"].includes(decision.action))
   unresolved.push(item.fingerprint);
 }
 return {permitted:unresolved.length===0,unresolved,
  inventorySha256:inventory.inventorySha256};
}
