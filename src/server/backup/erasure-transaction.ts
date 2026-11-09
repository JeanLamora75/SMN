import type {Client} from "pg";
import {beginErasureIntent,finalizeErasureIntent,
 type IntentHandle} from "./erasure-intent";

/**
 * Lower-level crash-audited unit of work, NOT an authorization endpoint.
 * Upstream MUST supply an independently approved, exhaustive scope and
 * restrict all effects to verified SQL-only operations. No external file
 * writes are allowed inside the callback. No bypass/force parameter exists.
 *
 * A pending external intent is durable before BEGIN. An immutable in-DB
 * receipt is committed atomically with the data changes. If anything fails,
 * the external intent persists and blocks all active restores until an
 * independently verified reconciliation.
 */
export async function withAuditedErasureTransaction(
 db:Pick<Client,"query">,
 input:Readonly<{scopeRevision:string;operation:"erase"|"anonymize";expectedRows?:number;subjectId?:string}>,
 apply:()=>Promise<number>
):Promise<Readonly<{receiptId:string;affectedRows:number;recorded:true}>>{
 const pending:IntentHandle=await beginErasureIntent({
  planRevision:input.scopeRevision,operation:input.operation,
  subjectId:input.subjectId
 });
 let started=false,committed=false,affectedRows=0;
 try{
  await db.query("BEGIN ISOLATION LEVEL SERIALIZABLE");started=true;
  await db.query("SELECT pg_advisory_xact_lock(20261109,39)");
  const schema=await db.query<{tablename:string}>(
   "SELECT tablename FROM pg_catalog.pg_tables"+
   " WHERE schemaname='public' AND tablename='smn_privacy_erasure_receipt'");
  if(schema.rows.length!==1)throw Error("privacy-receipt-schema-unavailable");
  const predicted=input.expectedRows;
  if(predicted!==undefined){
   if(!Number.isSafeInteger(predicted)||predicted<1)
    throw Error("privacy-erasure-expected-rows-invalid");
   // Immutable receipt is inserted BEFORE guarded DELETE, but in the
   // very same transaction. A rollback removes both receipt and deletion.
   await db.query("SELECT set_config('smn.privacy_receipt_id',$1,true)",[pending.id]);
   await db.query(
    "INSERT INTO public.smn_privacy_erasure_receipt"+
    "(id,scope_revision,operation,affected_rows) VALUES($1,$2,$3,$4)",
    [pending.id,input.scopeRevision,input.operation,predicted]);
  }
  affectedRows=await apply();
  if(!Number.isSafeInteger(affectedRows)||affectedRows<0)
   throw Error("privacy-erasure-count-invalid");
  if(predicted!==undefined){
   if(affectedRows!==predicted)throw Error("privacy-erasure-affected-row-mismatch");
  }else{
   await db.query(
    "INSERT INTO public.smn_privacy_erasure_receipt"+
    "(id,scope_revision,operation,affected_rows) VALUES($1,$2,$3,$4)",
    [pending.id,input.scopeRevision,input.operation,affectedRows]);
  }
  await db.query("COMMIT");committed=true;
 }catch{
  if(started&&!committed)await db.query("ROLLBACK").catch(()=>undefined);
  // DO NOT silently cancel the intent: a connection failure during COMMIT
  // can make the transaction outcome unknowable to this process.
  throw Error("privacy-erasure-outcome-unresolved");
 }
 try{await finalizeErasureIntent(pending,db);}
 catch{throw Error("privacy-erasure-external-audit-incomplete");}
 return {receiptId:pending.id,affectedRows,recorded:true};
}

/**
 * Read-only reconciliation evidence. A missing row does not authorize
 * removal of an intent: an operator must prove that no other effect occurred.
 */
export async function inspectErasureCommit(
 db:Pick<Client,"query">,receiptId:string
):Promise<Readonly<{state:"committed"|"not-found"|"unverifiable";affectedRows:number|null}>>{
 if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(receiptId))
  return {state:"unverifiable",affectedRows:null};
 try{
  const rows=await db.query<{affected_rows:string}>(
   "SELECT affected_rows::text FROM public.smn_privacy_erasure_receipt WHERE id=$1",
   [receiptId]);
  if(rows.rows.length===0)return {state:"not-found",affectedRows:null};
  const n=Number(rows.rows[0].affected_rows);
  if(rows.rows.length!==1||!Number.isSafeInteger(n)||n<0)
   return {state:"unverifiable",affectedRows:null};
  return {state:"committed",affectedRows:n};
 }catch{return {state:"unverifiable",affectedRows:null};}
}
