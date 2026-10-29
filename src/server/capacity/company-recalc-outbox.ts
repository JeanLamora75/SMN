import {randomUUID} from "node:crypto";
import type {Client} from "pg";

/** Vérifie la migration sans modifier le schéma sur le chemin métier. */
export async function ensureCapacityRecalcOutbox(db:Client){
 const check=await db.query<{ready:boolean}>(`SELECT
  to_regclass('public.smn_company_capacity_recalc') IS NOT NULL
  AND EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public'
   AND tablename='smn_company_capacity_recalc'
   AND indexname='smn_company_capacity_recalc_due_idx')
  AND (SELECT count(DISTINCT column_name) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='smn_company_capacity_recalc'
   AND column_name IN ('id','company_id','closure_id','closure_revision','start_on',
   'end_on','status','attempts','last_error','result','next_attempt_at','created_at','updated_at'))=13
  AS ready`);
 if(!check.rows[0]?.ready)throw Error("company-capacity-outbox-schema-missing: apply company capacity outbox migration");
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
export async function finishRecalculation(db:Client,id:string,error?:string,result?:unknown){
 await db.query(`UPDATE public.smn_company_capacity_recalc SET
 status=$2,last_error=$3,result=$4::jsonb,next_attempt_at=CASE WHEN $3::text IS NULL THEN now()
 ELSE now()+interval '5 minutes'*LEAST(attempts,12) END,updated_at=now()
 WHERE id=$1 AND status='running'`,[id,error?"failed":"done",error?.slice(0,500)??null,result===undefined?null:JSON.stringify(result)]);
}
export async function recoverStaleRecalculations(db:Client){
 await db.query(`UPDATE public.smn_company_capacity_recalc
 SET status='failed',last_error='worker-stale',next_attempt_at=now(),updated_at=now()
 WHERE status='running' AND updated_at<now()-interval '15 minutes'`);
}
