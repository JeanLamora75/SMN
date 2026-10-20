import { randomUUID, createHash } from "node:crypto";
import type { Client } from "pg";
import { INITIAL_MIGRATION } from "../installation/contract";
import { INITIAL_SCHEMA_SQL } from "../installation/migration";

export const ACCOUNTS_MIGRATION = "20261020_smn15_accounts";
export const ACCOUNTS_MIGRATION_SQL = `ALTER TABLE public.smn_account
  ADD COLUMN is_active boolean NOT NULL DEFAULT true;
CREATE UNIQUE INDEX smn_account_username_ci_key
  ON public.smn_account(lower(username));
CREATE UNIQUE INDEX smn_account_email_ci_key
  ON public.smn_account(lower(email));
UPDATE public.smn_installation SET schema_version=2 WHERE id='singleton' AND schema_version=1;
`;
const checksum = (s: string) => createHash("sha256").update(s).digest("hex");

/** Migration non destructive de l'installation existante, atomique et idempotente. */
export async function ensureAccountsSchema(client: Client): Promise<void> {
  await client.query("BEGIN");
  try {
    await client.query("SELECT pg_advisory_xact_lock(20261020,15)");
    const records = await client.query<{schema_version: number; state: string}>(
      "SELECT schema_version,state FROM public.smn_installation WHERE id='singleton' FOR UPDATE");
    if (records.rowCount !== 1 || records.rows[0].state !== "initialized") throw new Error("smn-schema-not-ready");
    const migrations = await client.query<{
      migration_name: string; checksum: string; finished_at: Date|null; rolled_back_at: Date|null
    }>("SELECT migration_name,checksum,finished_at,rolled_back_at FROM public._prisma_migrations ORDER BY migration_name");
    const base = migrations.rows.find(x=>x.migration_name === INITIAL_MIGRATION);
    if (!base || base.checksum !== checksum(INITIAL_SCHEMA_SQL) || !base.finished_at || base.rolled_back_at)
      throw new Error("smn-schema-incompatible");
    if (records.rows[0].schema_version === 2) {
      const next = migrations.rows.find(x=>x.migration_name === ACCOUNTS_MIGRATION);
      if (migrations.rowCount !== 2 || !next || next.checksum !== checksum(ACCOUNTS_MIGRATION_SQL) ||
          !next.finished_at || next.rolled_back_at) throw new Error("smn-schema-incompatible");
      const column = await client.query<{exists: boolean}>(`
        SELECT EXISTS(SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='smn_account' AND column_name='is_active') AS exists`);
      if (column.rows[0]?.exists !== true) throw new Error("smn-schema-incompatible");
      await client.query("COMMIT");
      return;
    }
    if (records.rows[0].schema_version !== 1 || migrations.rowCount !== 1) throw new Error("smn-schema-incompatible");
    // N'appliquer la migration que sur le schéma initial complet, pas une DB inconnue.
    const required = await client.query<{count: string}>(`
      SELECT count(*)::text AS count FROM information_schema.columns
      WHERE table_schema='public' AND table_name='smn_account'
        AND column_name IN ('id','username','email','role','password_hash','must_change_password')`);
    if (required.rows[0]?.count !== "6") throw new Error("smn-schema-incompatible");
    await client.query(ACCOUNTS_MIGRATION_SQL);
    await client.query(`INSERT INTO public._prisma_migrations
      (id,checksum,finished_at,migration_name,applied_steps_count)
      VALUES($1,$2,now(),$3,1)`,[randomUUID(),checksum(ACCOUNTS_MIGRATION_SQL),ACCOUNTS_MIGRATION]);
    await client.query("COMMIT");
  } catch(error) {
    await client.query("ROLLBACK").catch(()=>undefined);
    throw error;
  }
}
