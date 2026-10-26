import type {Client} from "pg";

/** Additive pilot schema, preserving existing technical holiday coverage and report snapshots. */
export async function ensureManualHolidaySchema(db:Client):Promise<void>{
 await db.query("BEGIN");
 try{
  await db.query("SELECT pg_advisory_xact_lock(20261026,273)");
  await db.query("ALTER TABLE public.smn_country ADD COLUMN IF NOT EXISTS archived_at timestamptz");
  await db.query("ALTER TABLE public.smn_national_calendar_coverage ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 0");
  await db.query("ALTER TABLE public.smn_national_calendar_coverage ADD COLUMN IF NOT EXISTS administrative_validated_at timestamptz");
  await db.query("ALTER TABLE public.smn_national_calendar_coverage ADD COLUMN IF NOT EXISTS validated_revision integer");
  await db.query(\`CREATE TABLE IF NOT EXISTS public.smn_national_holiday_manual_audit(
   id text PRIMARY KEY,
   country_code text NOT NULL REFERENCES public.smn_country(code) ON DELETE RESTRICT,
   action text NOT NULL CHECK(action IN ('create','update','delete')),
   previous_date date,
   new_date date,
   previous_name text,
   new_name text,
   reason text NOT NULL CHECK(char_length(btrim(reason)) BETWEEN 1 AND 500),
   actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
   occurred_at timestamptz NOT NULL DEFAULT now(),
   CHECK (
    (action='create' AND previous_date IS NULL AND previous_name IS NULL AND new_date IS NOT NULL AND new_name IS NOT NULL)
    OR (action='update' AND previous_date IS NOT NULL AND previous_name IS NOT NULL AND new_date IS NOT NULL AND new_name IS NOT NULL)
    OR (action='delete' AND previous_date IS NOT NULL AND previous_name IS NOT NULL AND new_date IS NULL AND new_name IS NULL)
   )
  )\`);
  await db.query(\`CREATE INDEX IF NOT EXISTS smn_national_holiday_manual_audit_country_idx
   ON public.smn_national_holiday_manual_audit(country_code,occurred_at)\`);
  await db.query("COMMIT");
 }catch(error){
  await db.query("ROLLBACK").catch(()=>undefined);
  throw error;
 }
}
