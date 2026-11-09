import type {Client} from "pg";

/**
 * SMN-35 — Commit business changes AND their success audit together.
 *
 * The callback must not issue BEGIN/COMMIT/ROLLBACK itself. A returned abort
 * rolls everything back, including any previously issued write.
 * Do not call over another active transaction or across external file writes.
 */
export type AtomicDecision<T>=
 | Readonly<{commit:true;value:T}>
 | Readonly<{commit:false;value:T}>;

export async function withAtomicBusinessUnit<T>(
 db:Pick<Client,"query">,
 work:()=>Promise<AtomicDecision<T>>
):Promise<T>{
 await db.query("BEGIN");
 let settled=false;
 try{
  const decision=await work();
  if(decision.commit){
   await db.query("COMMIT");
  }else{
   await db.query("ROLLBACK");
  }
  settled=true;
  return decision.value;
 }catch(error){
  if(!settled)await db.query("ROLLBACK").catch(()=>undefined);
  throw error;
 }
}
export const atomicCommit=<T>(value:T):AtomicDecision<T>=>({commit:true,value});
export const atomicAbort=<T>(value:T):AtomicDecision<T>=>({commit:false,value});
