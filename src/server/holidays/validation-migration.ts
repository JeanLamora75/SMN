import type {Client} from "pg";
import {ensureManualHolidaySchema} from "./manual-migration";

/** Idempotent additive schema for explicit yearly attestation and its audit trail. */
export async function ensureAnnualValidationSchema(db:Client):Promise<void>{
 await ensureManualHolidaySchema(db);
 await db.query("BEGIN");
 try{
  await db.query("SELECT pg_advisory_xact_lock(20261026,275)");
  await db.query(`ALTER TABLE public.smn_national_calendar_coverage
    ADD COLUMN IF NOT EXISTS validated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL`);
  await db.query(`ALTER TABLE public.smn_national_calendar_coverage
    ADD COLUMN IF NOT EXISTS validation_source text`);
  await db.query(`CREATE TABLE IF NOT EXISTS public.smn_national_calendar_validation_audit(
   id text PRIMARY KEY,
   country_code text NOT NULL REFERENCES public.smn_country(code) ON DELETE RESTRICT,
   calendar_year integer NOT NULL CHECK(calendar_year BETWEEN 1900 AND 2200),
   action text NOT NULL CHECK(action IN ('validate','invalidate')),
   revision integer NOT NULL CHECK(revision >= 0),
   fingerprint text,
   actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
   source text NOT NULL,
   occurred_at timestamptz NOT NULL DEFAULT now()
  )`);
  await db.query(`CREATE INDEX IF NOT EXISTS smn_national_calendar_validation_audit_idx
   ON public.smn_national_calendar_validation_audit(country_code,calendar_year,occurred_at)`);
  await db.query("COMMIT");
 }catch(e){
  await db.query("ROLLBACK").catch(()=>undefined);
  throw e;
 }
}
