import type {Client} from "pg";
import {lstat,readdir} from "node:fs/promises";
import {inspectMemberForeignReferences} from "../members/removal-audit";
import {pdfArchiveDirectory} from "./extra-archives";
import {officeReportsDirectory} from "../reports/office-storage";
import {officeTemplatesDirectory} from "../reports/office-catalog";
import {withAuditedErasureTransaction} from "./erasure-transaction";

/**
 * Narrow, fail-closed executor for a provisional member never used anywhere.
 *
 * A normal member with assignments, historical identities, metrics, files or
 * unclear provenance CANNOT pass this predicate. Those cases require a full
 * reviewed erasure plan (not supplied by this function).
 */
const IDENT=/^[A-Za-z0-9_-]{1,120}$/;
const TABLE=/^smn_[a-z][a-z0-9_]*$/;
const MAX_TABLES=400;

export type RestrictedErasureVerdict=Readonly<{
 eligible:boolean;
 reason:"eligible"|"invalid-member"|"member-not-isolated"|
 "references-present"|"uninspectable-references"|"uninspectable-text"|
 "possible-text-reference"|"binary-data-present"|"files-present"|"files-unverifiable";
}>;

const refuse=(reason:RestrictedErasureVerdict["reason"]):RestrictedErasureVerdict=>
 ({eligible:false,reason});

async function emptyStore(path:string):Promise<boolean>{
 const stat=await lstat(path).catch((error:NodeJS.ErrnoException)=>{
  if(error.code==="ENOENT")return null;throw error;
 });
 if(!stat)return true;
 if(!stat.isDirectory()||stat.isSymbolicLink())return false;
 const items=await readdir(path);
 return items.length===0;
}

/**
 * A global empty-file requirement is deliberately stricter than name matching:
 * a scanned PDF, an image or an embedded Office object cannot be cleared by
 * finding zero literal names in its text layer.
 */
export async function managedBinaryScopeEmpty():Promise<boolean>{
 if(!process.env.SMN_PRIVATE_DOCUMENTS_DIR)return false;
 try{
  for(const path of [process.env.SMN_PRIVATE_DOCUMENTS_DIR,
   pdfArchiveDirectory(),officeReportsDirectory(),officeTemplatesDirectory()])
   if(!await emptyStore(path))return false;
  return true;
 }catch{return false;}
}

/** Must be called again INSIDE the same serializable transaction as DELETE. */
export async function inspectRestrictedMemberErasure(db:Client,memberId:string):
 Promise<RestrictedErasureVerdict>{
 if(!IDENT.test(memberId))return refuse("invalid-member");
 const member=await db.query<{
  id:string;display_name:string;email:string|null;
  is_provisional:boolean;revision:number;
 }>("SELECT id,display_name,email,is_provisional,revision FROM public.smn_member "+
 "WHERE installation_id='singleton' AND id=$1 FOR UPDATE",[memberId]);
 if(member.rows.length!==1)return refuse("invalid-member");
 const subject=member.rows[0];
 // No earlier confirmed identity or historical change may survive outside
 // the row being removed. This is NOT an anonymisation claim.
 if(!subject.is_provisional||subject.revision!==0||subject.email!==null)
  return refuse("member-not-isolated");
 const refs=await inspectMemberForeignReferences(db,memberId);
 if(refs.unknown)return refuse("uninspectable-references");
 if(refs.count!==0)return refuse("references-present");
 const tables=await db.query<{tablename:string}>(
  "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname='public' "+
  "AND tablename LIKE 'smn_%' ORDER BY tablename LIMIT $1",[MAX_TABLES+1]);
 if(tables.rows.length>MAX_TABLES||
  tables.rows.some(r=>!TABLE.test(r.tablename)))
  return refuse("uninspectable-text");
 const aliases=[subject.id,subject.display_name,subject.email]
  .filter((v):v is string=>typeof v==="string"&&v.length>0);
 for(const {tablename} of tables.rows){
  if(tablename==="smn_member")continue;
  // Parameterized literal substring, not a regex; scan all PostgreSQL columns,
  // including history JSON. A match is a blocker, not an instruction to redact.
  const name='"'+tablename+'"';
  try{
   const found=await db.query<{present:boolean}>(
    "SELECT EXISTS(SELECT 1 FROM public."+name+" AS t "+
    "WHERE EXISTS(SELECT 1 FROM unnest($1::text[]) AS a(value) "+
    "WHERE position(lower(a.value) IN lower(to_jsonb(t)::text))>0)) AS present",
    [aliases]);
   if(found.rows[0]?.present!==false)return refuse("possible-text-reference");
  }catch{return refuse("uninspectable-text");}
 }
 // Binary PostgreSQL columns may carry an image or document that does not
 // contain a searchable name. Require them to be entirely empty.
 const binary=await db.query<{table_name:string}>(
  "SELECT DISTINCT table_name FROM information_schema.columns "+
  "WHERE table_schema='public' AND data_type='bytea' AND table_name LIKE 'smn_%' "+
  "ORDER BY table_name LIMIT $1",[MAX_TABLES+1]);
 if(binary.rows.length>MAX_TABLES||
  binary.rows.some(r=>!TABLE.test(r.table_name)))
  return refuse("binary-data-present");
 for(const {table_name} of binary.rows){
  const present=await db.query<{present:boolean}>(
   "SELECT EXISTS(SELECT 1 FROM public.\""+table_name+"\") AS present");
  if(present.rows[0]?.present!==false)return refuse("binary-data-present");
 }
 return {eligible:true,reason:"eligible"};
}

/**
 * This never accepts client-supplied SQL, a force flag or an external review
 * claim. Intent is persisted before BEGIN; COMMIT includes an immutable
 * receipt. A failed/uncertain result remains blocked by the external intent.
 */
export async function eraseRestrictedMember(db:Client,input:{
 memberId:string;scopeRevision:string;
}):Promise<Readonly<{receiptId:string;affectedRows:1;recorded:true}>>{
 if(!IDENT.test(input.memberId)||!/^[a-f0-9]{64}$/.test(input.scopeRevision))
  throw Error("privacy-restricted-input-invalid");
 if(!await managedBinaryScopeEmpty())
  throw Error("privacy-managed-files-unverifiable");
 const preflight=await inspectRestrictedMemberErasure(db,input.memberId);
 if(!preflight.eligible)throw Error("privacy-restricted-scope-"+preflight.reason);
 const result=await withAuditedErasureTransaction(db,{
  scopeRevision:input.scopeRevision,operation:"erase"
 },async()=>{
  if(!await managedBinaryScopeEmpty())
   throw Error("privacy-files-changed");
  const checked=await inspectRestrictedMemberErasure(db,input.memberId);
  if(!checked.eligible)throw Error("privacy-scope-changed");
  const deletion=await db.query(
   "DELETE FROM public.smn_member WHERE id=$1 AND installation_id='singleton'",
   [input.memberId]);
  if(deletion.rowCount!==1)throw Error("privacy-erasure-postcondition-invalid");
  const remaining=await db.query(
   "SELECT 1 FROM public.smn_member WHERE id=$1",[input.memberId]);
  if(remaining.rows.length!==0)throw Error("privacy-erasure-postcondition-invalid");
  return 1;
 });
 if(result.affectedRows!==1)throw Error("privacy-erasure-postcondition-invalid");
 return {...result,affectedRows:1};
}
