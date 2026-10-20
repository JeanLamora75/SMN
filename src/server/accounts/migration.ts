import { randomUUID, createHash } from "node:crypto";
import type { Client } from "pg";
import { INITIAL_MIGRATION } from "../installation/contract";
import { INITIAL_SCHEMA_SQL } from "../installation/migration";
import { RECOVERY_MIGRATION, RECOVERY_MIGRATION_SQL } from "./recovery-migration";
import { SETTINGS_MIGRATION, SETTINGS_MIGRATION_SQL } from "../settings/migration";
import { CONFIGURATION_MIGRATION, CONFIGURATION_MIGRATION_SQL } from "../configuration/migration";

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

/** Migrations I0 addititives dans une transaction sérialisée ; jamais de réinstallation. */
export async function ensureAccountsSchema(client: Client): Promise<void> {
  await client.query("BEGIN");
  try {
    await client.query("SELECT pg_advisory_xact_lock(20261020,15)");
    const records = await client.query<{schema_version:number;state:string}>(
      "SELECT schema_version,state FROM public.smn_installation WHERE id='singleton' FOR UPDATE");
    if (records.rowCount !== 1 || records.rows[0].state !== "initialized") throw new Error("smn-schema-not-ready");
    let version=records.rows[0].schema_version;
    if (![1,2,3,4,5].includes(version)) throw new Error("smn-schema-incompatible");
    const migrations = await client.query<{migration_name:string;checksum:string;finished_at:Date|null;rolled_back_at:Date|null}>(
      "SELECT migration_name,checksum,finished_at,rolled_back_at FROM public._prisma_migrations ORDER BY migration_name");
    const applied=(name:string,sql:string)=>migrations.rows.some(x=>x.migration_name===name &&
      x.checksum===checksum(sql) && !!x.finished_at && !x.rolled_back_at);
    if (!applied(INITIAL_MIGRATION,INITIAL_SCHEMA_SQL) || migrations.rowCount !== version)
      throw new Error("smn-schema-incompatible");

    if (version===1) {
      const columns=await client.query<{count:string}>(`
        SELECT count(*)::text AS count FROM information_schema.columns
        WHERE table_schema='public' AND table_name='smn_account'
          AND column_name IN ('id','username','email','role','password_hash','must_change_password')`);
      if (columns.rows[0]?.count!=="6") throw new Error("smn-schema-incompatible");
      await client.query(ACCOUNTS_MIGRATION_SQL);
      await client.query(`INSERT INTO public._prisma_migrations
        (id,checksum,finished_at,migration_name,applied_steps_count)
        VALUES($1,$2,now(),$3,1)`,[randomUUID(),checksum(ACCOUNTS_MIGRATION_SQL),ACCOUNTS_MIGRATION]);
      version=2;
    } else if (!applied(ACCOUNTS_MIGRATION,ACCOUNTS_MIGRATION_SQL)) {
      throw new Error("smn-schema-incompatible");
    }
    const accountColumns=await client.query<{exists:boolean}>(`
      SELECT EXISTS(SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='smn_account' AND column_name='is_active') AS exists`);
    if (!accountColumns.rows[0]?.exists) throw new Error("smn-schema-incompatible");

    if (version===2) {
      await client.query(RECOVERY_MIGRATION_SQL);
      await client.query(`INSERT INTO public._prisma_migrations
        (id,checksum,finished_at,migration_name,applied_steps_count)
        VALUES($1,$2,now(),$3,1)`,[randomUUID(),checksum(RECOVERY_MIGRATION_SQL),RECOVERY_MIGRATION]);
      version=3;
    } else if (!applied(RECOVERY_MIGRATION,RECOVERY_MIGRATION_SQL)) {
      throw new Error("smn-schema-incompatible");
    }
    const objects=await client.query<{count:string}>(`
      SELECT count(*)::text AS count FROM information_schema.columns
      WHERE table_schema='public' AND
        ((table_name='smn_recovery_phrase' AND column_name IN ('account_id','phrase_hash','created_at'))
        OR (table_name='smn_auth_audit' AND column_name IN ('id','account_id','action','created_at')))`);
    if (objects.rows[0]?.count!=="7") throw new Error("smn-schema-incompatible");
    if (version===3) {
      await client.query(SETTINGS_MIGRATION_SQL);
      await client.query(`INSERT INTO public._prisma_migrations
        (id,checksum,finished_at,migration_name,applied_steps_count)
        VALUES($1,$2,now(),$3,1)`,[randomUUID(),checksum(SETTINGS_MIGRATION_SQL),SETTINGS_MIGRATION]);
      version=4;
    } else if (!applied(SETTINGS_MIGRATION,SETTINGS_MIGRATION_SQL)) {
      throw new Error("smn-schema-incompatible");
    }
    const settingsColumns=await client.query<{count:string}>(`
      SELECT count(*)::text AS count FROM information_schema.columns
      WHERE table_schema='public' AND
        ((table_name='smn_general_settings' AND column_name IN
          ('installation_id','locale','theme','reference_country','revision','updated_at','updated_by'))
        OR (table_name='smn_general_settings_audit' AND column_name IN
          ('id','installation_id','actor_id','old_values','new_values','changed_at')))`);
    if (settingsColumns.rows[0]?.count!=="13") throw new Error("smn-schema-incompatible");
    if (version===4) {
      await client.query(CONFIGURATION_MIGRATION_SQL);
      await client.query(`INSERT INTO public._prisma_migrations
        (id,checksum,finished_at,migration_name,applied_steps_count)
        VALUES($1,$2,now(),$3,1)`,[randomUUID(),checksum(CONFIGURATION_MIGRATION_SQL),CONFIGURATION_MIGRATION]);
    } else if (!applied(CONFIGURATION_MIGRATION,CONFIGURATION_MIGRATION_SQL)) {
      throw new Error("smn-schema-incompatible");
    }
    const taskColumns=await client.query<{count:string}>(`
      SELECT count(*)::text AS count FROM information_schema.columns
      WHERE table_schema='public' AND table_name='smn_configuration_task'
        AND column_name IN ('installation_id','task_key','status','updated_at','updated_by')`);
    if (taskColumns.rows[0]?.count!=="5") throw new Error("smn-schema-incompatible");
    await client.query("COMMIT");
  } catch(error) {
    await client.query("ROLLBACK").catch(()=>undefined);
    throw error;
  }
}
