import type {Client} from "pg";
import {ensureCountryNameSchema} from "./name-migration";
import {ensureManualHolidaySchema} from "../holidays/manual-migration";

/** Shared serialisation point for country lifecycle and new country assignments. */
export const COUNTRY_LIFECYCLE_LOCK="SELECT pg_advisory_xact_lock(20261026,279)";

export async function ensureCountryArchiveSchema(db:Client):Promise<void>{
 await ensureCountryNameSchema(db);
 await ensureManualHolidaySchema(db);
 await db.query("BEGIN");
 try{
  await db.query("SELECT pg_advisory_xact_lock(20261026,1279)");
  await db.query(`CREATE TABLE IF NOT EXISTS public.smn_country_lifecycle_audit(
   id text PRIMARY KEY,
   country_code text NOT NULL REFERENCES public.smn_country(code) ON DELETE RESTRICT,
   action text NOT NULL CHECK(action IN ('archive','reactivate')),
   old_archived_at timestamptz,
   new_archived_at timestamptz,
   old_revision integer NOT NULL,
   new_revision integer NOT NULL,
   actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
   occurred_at timestamptz NOT NULL DEFAULT now(),
   CHECK(new_revision=old_revision+1)
  )`);
  await db.query(`CREATE INDEX IF NOT EXISTS smn_country_lifecycle_audit_country_idx
   ON public.smn_country_lifecycle_audit(country_code,occurred_at)`);
  await db.query("COMMIT");
 }catch(error){
  await db.query("ROLLBACK").catch(()=>undefined);
  throw error;
 }
}
