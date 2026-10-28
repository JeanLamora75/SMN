import {randomUUID} from "node:crypto";
import type {Client} from "pg";

/** Durable outbox is installed before the domain transaction; never inside read paths. */
export async function ensureCapacityRecalcOutbox(db:Client){
 await db.query(`CREATE TABLE IF NOT EXISTS public.smn_company_capacity_recalc (
  id text PRIMARY KEY,
  company_id text NOT NULL REFERENCES public.smn_company(id) ON DELETE RESTRICT,
  closure_id text NOT NULL REFERENCES public.smn_company_closure(id) ON DELETE RESTRICT,
  closure_revision integer NOT NULL CHECK(closure_revision>0),
  start_on date NOT NULL,
  end_on date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','running','done','failed')),
  attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0),
  last_error text,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(start_on<=end_on),
  UNIQUE(closure_id,closure_revision)
 )`);
 await db.query(`CREATE INDEX IF NOT EXISTS smn_company_capacity_recalc_due_idx
 ON public.smn_company_capacity_recalc(status,next_attempt_at)`);
}
export async function queueClosureRecalculation(db:Client,input:{
 companyId:string;closureId:string;revision:number;startOn:string;endOn:string;
 previousStartOn?:string;previousEndOn?:string
}){
 const start=[input.startOn,input.previousStartOn].filter((v):v is string=>!!v).sort()[0];
 const end=[input.endOn,input.previousEndOn].filter((v):v is string=>!!v).sort().at(-1)!;
 await db.query(`INSERT INTO public.smn_company_capacity_recalc
 (id,company_id,closure_id,closure_revision,start_on,end_on)
 VALUES($1,$2,$3,$4,$5::date,$6::date)
 ON CONFLICT(closure_id,closure_revision) DO NOTHING`,
 [randomUUID(),input.companyId,input.closureId,input.revision,start,end]);
}
export type RecalcJob={id:string;company_id:string;start_on:string;end_on:string;attempts:number};
/** A worker leases one row at a time; failures remain recoverable after restart. */
export async function claimRecalculation(db:Client):Promise<RecalcJob|null>{
 await db.query("BEGIN");
 try{
  const r=await db.query<RecalcJob>(`SELECT id,company_id,start_on::text AS start_on,
   end_on::text AS end_on,attempts
   FROM public.smn_company_capacity_recalc
   WHERE status IN ('pending','failed') AND next_attempt_at<=now() AND attempts<10
   ORDER BY created_at,id FOR UPDATE SKIP LOCKED LIMIT 1`);
  if(!r.rows.length){await db.query("COMMIT");return null;}
  const job=r.rows[0];
  await db.query(`UPDATE public.smn_company_capacity_recalc
   SET status='running',attempts=attempts+1,updated_at=now()
   WHERE id=$1`,[job.id]);
  await db.query("COMMIT");
  return {...job,attempts:job.attempts+1};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
export async function finishRecalculation(db:Client,id:string,error?:string){
 await db.query(`UPDATE public.smn_company_capacity_recalc SET
 status=$2,last_error=$3,next_attempt_at=CASE WHEN $3::text IS NULL THEN now()
 ELSE now()+interval '5 minutes'*LEAST(attempts,12) END,updated_at=now()
 WHERE id=$1 AND status='running'`,[id,error?"failed":"done",error?.slice(0,500)??null]);
}
export async function recoverStaleRecalculations(db:Client){
 await db.query(`UPDATE public.smn_company_capacity_recalc
 SET status='failed',last_error='worker-stale',next_attempt_at=now(),updated_at=now()
 WHERE status='running' AND updated_at<now()-interval '15 minutes'`);
}
