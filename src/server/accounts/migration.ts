import { randomUUID, createHash } from "node:crypto";
import type { Client } from "pg";
import { INITIAL_MIGRATION } from "../installation/contract";
import { INITIAL_SCHEMA_SQL } from "../installation/migration";
import { RECOVERY_MIGRATION, RECOVERY_MIGRATION_SQL } from "./recovery-migration";
import { SETTINGS_MIGRATION, SETTINGS_MIGRATION_SQL } from "../settings/migration";
import { CONFIGURATION_MIGRATION, CONFIGURATION_MIGRATION_SQL } from "../configuration/migration";
import {APPEARANCE_MIGRATION,APPEARANCE_MIGRATION_SQL} from "../settings/appearance-migration";
import {ACCOUNT_AUDIT_MIGRATION,ACCOUNT_AUDIT_MIGRATION_SQL} from "../audit/account-migration";
import {BACKUP_RETENTION_MIGRATION,BACKUP_RETENTION_MIGRATION_SQL} from "../backup/retention-migration";
import {MEMBERS_MIGRATION,MEMBERS_MIGRATION_SQL} from "../members/migration";
import {MEMBER_PROFILE_MIGRATION,MEMBER_PROFILE_MIGRATION_SQL} from "../members/profile-migration";

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
    if (![1,2,3,4,5,6,7,8,9,10].includes(version)) throw new Error("smn-schema-incompatible");
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
      version=5;
    } else if (!applied(CONFIGURATION_MIGRATION,CONFIGURATION_MIGRATION_SQL)) {
      throw new Error("smn-schema-incompatible");
    }
    const taskColumns=await client.query<{count:string}>(`
      SELECT count(*)::text AS count FROM information_schema.columns
      WHERE table_schema='public' AND table_name='smn_configuration_task'
        AND column_name IN ('installation_id','task_key','status','updated_at','updated_by')`);
    if (taskColumns.rows[0]?.count!=="5") throw new Error("smn-schema-incompatible");
    if (version===5) {
      await client.query(APPEARANCE_MIGRATION_SQL);
      await client.query(`INSERT INTO public._prisma_migrations
        (id,checksum,finished_at,migration_name,applied_steps_count)
        VALUES($1,$2,now(),$3,1)`,[randomUUID(),checksum(APPEARANCE_MIGRATION_SQL),APPEARANCE_MIGRATION]);
      version=6;
    } else if (!applied(APPEARANCE_MIGRATION,APPEARANCE_MIGRATION_SQL)) {
      throw new Error("smn-schema-incompatible");
    }
    const paletteColumn=await client.query<{exists:boolean}>(`SELECT EXISTS(SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='smn_general_settings' AND column_name='palette') AS exists`);
    if (!paletteColumn.rows[0]?.exists) throw new Error("smn-schema-incompatible");
    if(version===6){
      await client.query(ACCOUNT_AUDIT_MIGRATION_SQL);
      await client.query(`INSERT INTO public._prisma_migrations
        (id,checksum,finished_at,migration_name,applied_steps_count)
        VALUES($1,$2,now(),$3,1)`,
        [randomUUID(),checksum(ACCOUNT_AUDIT_MIGRATION_SQL),ACCOUNT_AUDIT_MIGRATION]);
      version=7;
    }else if(!applied(ACCOUNT_AUDIT_MIGRATION,ACCOUNT_AUDIT_MIGRATION_SQL)){
      throw new Error("smn-schema-incompatible");
    }
    const auditColumns=await client.query<{count:string}>(`
      SELECT count(*)::text AS count FROM information_schema.columns
      WHERE table_schema='public' AND table_name='smn_account_audit'
       AND column_name IN ('id','installation_id','actor_id','object_id','action','outcome','old_values','new_values','occurred_at')`);
    if(auditColumns.rows[0]?.count!=="9")throw new Error("smn-schema-incompatible");
    if(version===7){
      await client.query(BACKUP_RETENTION_MIGRATION_SQL);
      await client.query(`INSERT INTO public._prisma_migrations
        (id,checksum,finished_at,migration_name,applied_steps_count)
        VALUES($1,$2,now(),$3,1)`,
        [randomUUID(),checksum(BACKUP_RETENTION_MIGRATION_SQL),BACKUP_RETENTION_MIGRATION]);
      version=8;
    }else if(!applied(BACKUP_RETENTION_MIGRATION,BACKUP_RETENTION_MIGRATION_SQL)){
      throw new Error("smn-schema-incompatible");
    }
    const retentionColumns=await client.query<{count:string}>(`
      SELECT count(*)::text AS count FROM information_schema.columns
      WHERE table_schema='public' AND
        ((table_name='smn_backup_retention' AND column_name IN
         ('installation_id','days','revision','updated_at','updated_by'))
        OR (table_name='smn_backup_retention_audit' AND column_name IN
         ('id','installation_id','actor_id','action','old_days','new_days','package_id','occurred_at')))`);
    if(retentionColumns.rows[0]?.count!=="13")throw new Error("smn-schema-incompatible");
    if(version===8){
      await client.query(MEMBERS_MIGRATION_SQL);
      await client.query(`INSERT INTO public._prisma_migrations
        (id,checksum,finished_at,migration_name,applied_steps_count)
        VALUES($1,$2,now(),$3,1)`,
        [randomUUID(),checksum(MEMBERS_MIGRATION_SQL),MEMBERS_MIGRATION]);
      version=9;
    }else if(!applied(MEMBERS_MIGRATION,MEMBERS_MIGRATION_SQL)){
      throw new Error("smn-schema-incompatible");
    }
    const memberColumns=await client.query<{count:string}>(`
     SELECT count(*)::text AS count FROM information_schema.columns
     WHERE table_schema='public' AND (
     (table_name='smn_member_batch' AND column_name IN
      ('id','installation_id','team_id','requested_count','created_by','created_at'))
     OR (table_name='smn_member' AND column_name IN
      ('id','installation_id','batch_id','member_number','display_name','is_provisional','contract_percent','contribution_percent','created_at'))
     OR (table_name='smn_member_assignment' AND column_name IN
      ('id','member_id','team_id','start_on','end_on','agile_role','allocation_percent','role_percent')))`);
    if(memberColumns.rows[0]?.count!=="23")throw new Error("smn-schema-incompatible");
    if(version===9){
      await client.query(MEMBER_PROFILE_MIGRATION_SQL);
      await client.query(`INSERT INTO public._prisma_migrations
        (id,checksum,finished_at,migration_name,applied_steps_count)
        VALUES($1,$2,now(),$3,1)`,
        [randomUUID(),checksum(MEMBER_PROFILE_MIGRATION_SQL),MEMBER_PROFILE_MIGRATION]);
      version=10;
    }else if(!applied(MEMBER_PROFILE_MIGRATION,MEMBER_PROFILE_MIGRATION_SQL)){
      throw new Error("smn-schema-incompatible");
    }
    const profileColumns=await client.query<{count:string}>(`
      SELECT count(*)::text AS count FROM information_schema.columns
      WHERE table_schema='public' AND table_name='smn_member' AND
      column_name IN ('email','revision','updated_at')`);
    if(profileColumns.rows[0]?.count!=="3")throw new Error("smn-schema-incompatible");
    await client.query("COMMIT");
  } catch(error) {
    await client.query("ROLLBACK").catch(()=>undefined);
    throw error;
  }
}
