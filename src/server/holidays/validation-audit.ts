import {randomUUID} from "node:crypto";
import type {Client} from "pg";

/** Must run inside the mutation transaction, and only on a real data change. */
export async function appendAnnualInvalidationAudit(db:Client,code:string,year:number,
 revision:number,actorId:string|null,source:string):Promise<void>{
 await db.query(`INSERT INTO public.smn_national_calendar_validation_audit
  (id,country_code,calendar_year,action,revision,fingerprint,actor_id,source)
  VALUES($1,$2,$3,'invalidate',$4,NULL,$5,$6)`,
  [randomUUID(),code,year,revision,actorId,source]);
}
