import type {Client} from "pg";

/**
 * The pilot installs additive feature tables on first use, without changing
 * the strict installation schema version or rewriting historical records.
 */
export async function ensureCountryNameSchema(db:Client):Promise<void>{
 await db.query("BEGIN");
 try{
  await db.query("SELECT pg_advisory_xact_lock(20261026,271)");
  await db.query(`ALTER TABLE public.smn_country
    ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 0`);
  await db.query(`CREATE TABLE IF NOT EXISTS public.smn_country_name_audit(
    id text PRIMARY KEY,
    country_code text NOT NULL REFERENCES public.smn_country(code) ON DELETE RESTRICT,
    revision integer NOT NULL CHECK (revision > 0),
    previous_name text NOT NULL,
    new_name text NOT NULL,
    actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
    changed_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(country_code,revision)
  )`);
  await db.query("COMMIT");
 }catch(error){
  await db.query("ROLLBACK").catch(()=>undefined);
  throw error;
 }
}
