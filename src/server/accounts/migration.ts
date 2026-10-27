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
import {ASSIGNMENT_MIGRATION,ASSIGNMENT_MIGRATION_SQL} from "../members/assignment-migration";
import {LIFECYCLE_MIGRATION,LIFECYCLE_MIGRATION_SQL} from "../members/lifecycle-migration";
import {MEMBER_CALENDAR_MIGRATION,MEMBER_CALENDAR_MIGRATION_SQL} from "../members/calendar-migration";
import {MEMBER_LOCATION_MIGRATION,MEMBER_LOCATION_MIGRATION_SQL} from "../members/location-migration";
import {COUNTRIES_MIGRATION,COUNTRIES_MIGRATION_SQL} from "../countries/migration";
import {HOLIDAYS_MIGRATION,HOLIDAYS_MIGRATION_SQL} from "../holidays/migration";
import {HOLIDAY_CSV_MIGRATION,HOLIDAY_CSV_MIGRATION_SQL} from "../holidays/csv-migration";
import {HOLIDAY_ICS_MIGRATION,HOLIDAY_ICS_MIGRATION_SQL} from "../holidays/ics-migration";
import {ABSENCE_MIGRATION,ABSENCE_MIGRATION_SQL} from "../members/absence-migration";
import {CLOSURES_MIGRATION,CLOSURES_MIGRATION_SQL} from "../closures/migration";
import {CAPACITY_MIGRATION,CAPACITY_MIGRATION_SQL} from "../capacity/migration";
import {CAPACITY_OVERRIDE_MIGRATION,CAPACITY_OVERRIDE_MIGRATION_SQL} from "../capacity/override-migration";
import {CAPACITY_INITIAL_MIGRATION,CAPACITY_INITIAL_MIGRATION_SQL} from "../capacity/initial-migration";
import {CAPACITY_ACTUAL_MIGRATION,CAPACITY_ACTUAL_MIGRATION_SQL} from "../capacity/actual-migration";
import {CAPACITY_HISTORICAL_MIGRATION,CAPACITY_HISTORICAL_MIGRATION_SQL} from "../capacity/historical-migration";
import {CAPACITY_REPLANNING_MIGRATION,CAPACITY_REPLANNING_MIGRATION_SQL} from "../capacity/replanning-migration";
import {MEMBER_IDENTITY_MIGRATION,MEMBER_IDENTITY_MIGRATION_SQL} from "../members/identity-migration";
import {MULTI_TEAM_MIGRATION,MULTI_TEAM_SCHEMA_SQL} from "../teams/migration";
import {TEAM_AGILE_MIGRATION,TEAM_AGILE_MIGRATION_SQL} from "../teams/agile-migration";

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

/** Même version maximale que le diagnostic, sans autoriser les futures versions non connues. */
export function isSupportedAuthenticationSchemaVersion(version:number):boolean {
  return Number.isInteger(version) && version>=1 && version<=29;
}

/** La migration v27 est explicite : l'authentification la vérifie, sans la déclencher. */
/** La migration 28 est manuelle. L'authentification vérifie son checksum et l'intégrité,
 * sans la déclencher lors de la création d'une session.
 */
export function assertMultiTeamMigrationValid(version:number,
 migrationApplied:boolean,shapeValid:boolean):void{
 if(version===28 && (!migrationApplied || !shapeValid))
  throw new Error("smn-schema-incompatible");
}

export function assertIdentityMigrationValid(
  version:number,
  migrationApplied:boolean,
  identityColumnCount:string|undefined,
):void {
  if(version>=27 && (!migrationApplied || identityColumnCount!=="7"))
    throw new Error("smn-schema-incompatible");
}

/** Migrations I0 addititives dans une transaction sérialisée ; jamais de réinstallation. */
export async function ensureAccountsSchema(client: Client): Promise<void> {
  await client.query("BEGIN");
  try {
    await client.query("SELECT pg_advisory_xact_lock(20261020,15)");
    const records = await client.query<{schema_version:number;state:string}>(
      "SELECT schema_version,state FROM public.smn_installation WHERE id='singleton' FOR UPDATE");
    if (records.rowCount !== 1 || records.rows[0].state !== "initialized") throw new Error("smn-schema-not-ready");
    let version=records.rows[0].schema_version;
    if (!isSupportedAuthenticationSchemaVersion(version)) throw new Error("smn-schema-incompatible");
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
    if(version===10){
      await client.query(ASSIGNMENT_MIGRATION_SQL);
      await client.query(`INSERT INTO public._prisma_migrations
        (id,checksum,finished_at,migration_name,applied_steps_count)
        VALUES($1,$2,now(),$3,1)`,
        [randomUUID(),checksum(ASSIGNMENT_MIGRATION_SQL),ASSIGNMENT_MIGRATION]);
      version=11;
    }else if(!applied(ASSIGNMENT_MIGRATION,ASSIGNMENT_MIGRATION_SQL)){
      throw new Error("smn-schema-incompatible");
    }
    const assignmentVersionColumns=await client.query<{count:string}>(`
     SELECT count(*)::text AS count FROM information_schema.columns
     WHERE table_schema='public' AND table_name='smn_member_assignment_version'
      AND column_name IN ('id','assignment_id','revision','effective_from','allocation_percent',
       'contract_percent','contribution_percent','scrum_master_percent','product_owner_percent',
       'developer_percent','created_by','created_at')`);
    if(assignmentVersionColumns.rows[0]?.count!=="12")throw new Error("smn-schema-incompatible");
    if(version===11){
      await client.query(LIFECYCLE_MIGRATION_SQL);
      await client.query(`INSERT INTO public._prisma_migrations
        (id,checksum,finished_at,migration_name,applied_steps_count)
        VALUES($1,$2,now(),$3,1)`,
        [randomUUID(),checksum(LIFECYCLE_MIGRATION_SQL),LIFECYCLE_MIGRATION]);
      version=12;
    }else if(!applied(LIFECYCLE_MIGRATION,LIFECYCLE_MIGRATION_SQL)){
      throw new Error("smn-schema-incompatible");
    }
    const lifecycleColumns=await client.query<{count:string}>(`
      SELECT count(*)::text AS count FROM information_schema.columns
      WHERE table_schema='public' AND
      ((table_name='smn_member' AND column_name IN ('archived_at','archived_by'))
       OR (table_name='smn_member_lifecycle_event' AND column_name IN
       ('id','member_id','assignment_id','action','effective_on','performed_by','occurred_at','details')))`);
    if(lifecycleColumns.rows[0]?.count!=="10")throw new Error("smn-schema-incompatible");
    if(version===12){
      await client.query(MEMBER_CALENDAR_MIGRATION_SQL);
      await client.query(`INSERT INTO public._prisma_migrations
        (id,checksum,finished_at,migration_name,applied_steps_count)
        VALUES($1,$2,now(),$3,1)`,
        [randomUUID(),checksum(MEMBER_CALENDAR_MIGRATION_SQL),MEMBER_CALENDAR_MIGRATION]);
      version=13;
    }else if(!applied(MEMBER_CALENDAR_MIGRATION,MEMBER_CALENDAR_MIGRATION_SQL)){
      throw new Error("smn-schema-incompatible");
    }
    const calendarColumns=await client.query<{count:string}>(`
      SELECT count(*)::text AS count FROM information_schema.columns
      WHERE table_schema='public' AND
      ((table_name='smn_member_calendar_week' AND column_name IN
       ('id','member_id','revision','effective_from','days','created_by','created_at'))
       OR (table_name='smn_member_calendar_exception' AND column_name IN
       ('id','member_id','on_date','revision','morning','afternoon','note','created_by','created_at')))`);
    if(calendarColumns.rows[0]?.count!=="16")throw new Error("smn-schema-incompatible");
    if(version===13){
      await client.query(MEMBER_LOCATION_MIGRATION_SQL);
      await client.query(`INSERT INTO public._prisma_migrations
       (id,checksum,finished_at,migration_name,applied_steps_count)
       VALUES($1,$2,now(),$3,1)`,
       [randomUUID(),checksum(MEMBER_LOCATION_MIGRATION_SQL),MEMBER_LOCATION_MIGRATION]);
      version=14;
    }else if(!applied(MEMBER_LOCATION_MIGRATION,MEMBER_LOCATION_MIGRATION_SQL)){
      throw new Error("smn-schema-incompatible");
    }
    const locationColumns=await client.query<{count:string}>(`
      SELECT count(*)::text AS count FROM information_schema.columns
      WHERE table_schema='public' AND table_name='smn_member_location'
       AND column_name IN ('id','member_id','revision','effective_from','country_iso2',
        'region','city','time_zone','source','created_by','created_at')`);
    if(locationColumns.rows[0]?.count!=="11")throw new Error("smn-schema-incompatible");
    if(version===14){
      await client.query(COUNTRIES_MIGRATION_SQL);
      await client.query(`INSERT INTO public._prisma_migrations
        (id,checksum,finished_at,migration_name,applied_steps_count)
        VALUES($1,$2,now(),$3,1)`,
        [randomUUID(),checksum(COUNTRIES_MIGRATION_SQL),COUNTRIES_MIGRATION]);
      version=15;
    }else if(!applied(COUNTRIES_MIGRATION,COUNTRIES_MIGRATION_SQL)){
      throw new Error("smn-schema-incompatible");
    }
    const countriesShape=await client.query<{count:string}>(`
      SELECT count(*)::text AS count FROM information_schema.columns
      WHERE table_schema='public' AND table_name='smn_country'
        AND column_name IN ('code','name','origin','created_by','created_at')`);
    if(countriesShape.rows[0]?.count!=="5")throw new Error("smn-schema-incompatible");
    if(version===15){
      await client.query(HOLIDAYS_MIGRATION_SQL);
      await client.query(`INSERT INTO public._prisma_migrations
        (id,checksum,finished_at,migration_name,applied_steps_count)
        VALUES($1,$2,now(),$3,1)`,
        [randomUUID(),checksum(HOLIDAYS_MIGRATION_SQL),HOLIDAYS_MIGRATION]);
      version=16;
    }else if(!applied(HOLIDAYS_MIGRATION,HOLIDAYS_MIGRATION_SQL)){
      throw new Error("smn-schema-incompatible");
    }
    const holidayColumns=await client.query<{count:string}>(`
      SELECT count(*)::text AS count FROM information_schema.columns
      WHERE table_schema='public' AND
      ((table_name='smn_national_holiday' AND column_name IN
        ('country_code','holiday_date','name'))
       OR (table_name='smn_national_calendar_coverage' AND column_name IN
        ('country_code','calendar_year','status','entries_count','diagnostic','source_file','checked_at')))`);
    if(holidayColumns.rows[0]?.count!=="10")throw new Error("smn-schema-incompatible");
    if(version===16){
      await client.query(HOLIDAY_CSV_MIGRATION_SQL);
      await client.query(`INSERT INTO public._prisma_migrations
        (id,checksum,finished_at,migration_name,applied_steps_count)
        VALUES($1,$2,now(),$3,1)`,
        [randomUUID(),checksum(HOLIDAY_CSV_MIGRATION_SQL),HOLIDAY_CSV_MIGRATION]);
      version=17;
    }else if(!applied(HOLIDAY_CSV_MIGRATION,HOLIDAY_CSV_MIGRATION_SQL)){
      throw new Error("smn-schema-incompatible");
    }
    const csvAuditColumns=await client.query<{count:string}>(`
      SELECT count(*)::text AS count FROM information_schema.columns
      WHERE table_schema='public' AND table_name='smn_national_holiday_audit'
      AND column_name IN ('id','country_code','holiday_date','previous_name',
       'new_name','action','origin','actor_id','occurred_at')`);
    if(csvAuditColumns.rows[0]?.count!=="9")throw new Error("smn-schema-incompatible");
    if(version===17){
      await client.query(HOLIDAY_ICS_MIGRATION_SQL);
      await client.query(`INSERT INTO public._prisma_migrations
        (id,checksum,finished_at,migration_name,applied_steps_count)
        VALUES($1,$2,now(),$3,1)`,
        [randomUUID(),checksum(HOLIDAY_ICS_MIGRATION_SQL),HOLIDAY_ICS_MIGRATION]);
      version=18;
    }else if(!applied(HOLIDAY_ICS_MIGRATION,HOLIDAY_ICS_MIGRATION_SQL)){
      throw new Error("smn-schema-incompatible");
    }
    if(version===18){
      await client.query(ABSENCE_MIGRATION_SQL);
      await client.query(`INSERT INTO public._prisma_migrations
        (id,checksum,finished_at,migration_name,applied_steps_count)
        VALUES($1,$2,now(),$3,1)`,
        [randomUUID(),checksum(ABSENCE_MIGRATION_SQL),ABSENCE_MIGRATION]);
      version=19;
    }else if(!applied(ABSENCE_MIGRATION,ABSENCE_MIGRATION_SQL)){
      throw new Error("smn-schema-incompatible");
    }
    const absenceColumns=await client.query<{count:string}>(`
      SELECT count(*)::text AS count FROM information_schema.columns
      WHERE table_schema='public' AND
      ((table_name='smn_absence_category' AND column_name IN
        ('id','name','color','is_active','created_at','updated_at'))
       OR (table_name='smn_member_absence' AND column_name IN
        ('id','member_id','category_id','start_on','end_on','start_slot','end_slot',
         'is_planned','reason','revision','created_by','created_at','updated_by','updated_at'))
       OR (table_name='smn_member_absence_history' AND column_name IN
        ('id','absence_id','revision','operation','before_values','after_values','changed_by','changed_at'))) `);
    if(absenceColumns.rows[0]?.count!=="28")throw new Error("smn-schema-incompatible");
    if(version===19){
      await client.query(CLOSURES_MIGRATION_SQL);
      await client.query(`INSERT INTO public._prisma_migrations
        (id,checksum,finished_at,migration_name,applied_steps_count)
        VALUES($1,$2,now(),$3,1)`,
        [randomUUID(),checksum(CLOSURES_MIGRATION_SQL),CLOSURES_MIGRATION]);
      version=20;
    }else if(!applied(CLOSURES_MIGRATION,CLOSURES_MIGRATION_SQL)){
      throw new Error("smn-schema-incompatible");
    }
    const closuresColumns=await client.query<{count:string}>(`
      SELECT count(*)::text AS count FROM information_schema.columns
      WHERE table_schema='public' AND
      ((table_name='smn_company_closure' AND column_name IN
        ('id','team_id','name','start_on','end_on','is_active','revision',
         'created_by','created_at','updated_by','updated_at'))
       OR (table_name='smn_company_closure_history' AND column_name IN
        ('id','closure_id','revision','operation','previous_values','next_values',
         'changed_by','changed_at'))) `);
    if(closuresColumns.rows[0]?.count!=="19")throw new Error("smn-schema-incompatible");
    if(version===20){
      await client.query(CAPACITY_MIGRATION_SQL);
      await client.query(`INSERT INTO public._prisma_migrations
        (id,checksum,finished_at,migration_name,applied_steps_count)
        VALUES($1,$2,now(),$3,1)`,
        [randomUUID(),checksum(CAPACITY_MIGRATION_SQL),CAPACITY_MIGRATION]);
      version=21;
    }else if(!applied(CAPACITY_MIGRATION,CAPACITY_MIGRATION_SQL)){
      throw new Error("smn-schema-incompatible");
    }
    const capacityColumns=await client.query<{count:string}>(`
      SELECT count(*)::text AS count FROM information_schema.columns
      WHERE table_schema='public' AND
      ((table_name='smn_capacity_settings' AND column_name IN
        ('installation_id','hours_per_jh','revision','updated_by','updated_at'))
      OR (table_name='smn_capacity_settings_audit' AND column_name IN
        ('id','installation_id','revision','previous_hours','new_hours',
        'changed_by','changed_at'))) `);
    if(capacityColumns.rows[0]?.count!=="12")throw new Error("smn-schema-incompatible");
    if(version===21){
      await client.query(CAPACITY_OVERRIDE_MIGRATION_SQL);
      await client.query(`INSERT INTO public._prisma_migrations
        (id,checksum,finished_at,migration_name,applied_steps_count)
        VALUES($1,$2,now(),$3,1)`,
        [randomUUID(),checksum(CAPACITY_OVERRIDE_MIGRATION_SQL),CAPACITY_OVERRIDE_MIGRATION]);
      version=22;
    }else if(!applied(CAPACITY_OVERRIDE_MIGRATION,CAPACITY_OVERRIDE_MIGRATION_SQL)){
      throw new Error("smn-schema-incompatible");
    }
    const overrideColumns=await client.query<{count:string}>(`
      SELECT count(*)::text AS count FROM information_schema.columns
      WHERE table_schema='public' AND (
        (table_name='smn_capacity_period_override' AND column_name IN
         ('id','team_id','start_on','end_on','manual_jh','revision',
          'frozen_at','closed_at','updated_by','updated_at'))
        OR
        (table_name='smn_capacity_period_override_history' AND column_name IN
         ('id','period_id','revision','operation','before_jh','after_jh',
          'changed_by','changed_at'))
      )`);
    if(overrideColumns.rows[0]?.count!=="18")throw new Error("smn-schema-incompatible");
    if(version===22){
      await client.query(CAPACITY_INITIAL_MIGRATION_SQL);
      await client.query(`INSERT INTO public._prisma_migrations
        (id,checksum,finished_at,migration_name,applied_steps_count)
        VALUES($1,$2,now(),$3,1)`,
        [randomUUID(),checksum(CAPACITY_INITIAL_MIGRATION_SQL),CAPACITY_INITIAL_MIGRATION]);
      version=23;
    }else if(!applied(CAPACITY_INITIAL_MIGRATION,CAPACITY_INITIAL_MIGRATION_SQL)){
      throw new Error("smn-schema-incompatible");
    }
    const initialColumns=await client.query<{count:string}>(`
      SELECT count(*)::text AS count FROM information_schema.columns
      WHERE table_schema='public'
        AND table_name='smn_capacity_initial_snapshot'
        AND column_name IN('id','period_id','event_id','initial_jh','provenance',
          'actual_opened_at','recorded_at','opened_by','manual_revision')`);
    if(initialColumns.rows[0]?.count!=="9")throw new Error("smn-schema-incompatible");
    if(version===23){
      await client.query(CAPACITY_ACTUAL_MIGRATION_SQL);
      await client.query(`INSERT INTO public._prisma_migrations
        (id,checksum,finished_at,migration_name,applied_steps_count)
        VALUES($1,$2,now(),$3,1)`,
        [randomUUID(),checksum(CAPACITY_ACTUAL_MIGRATION_SQL),CAPACITY_ACTUAL_MIGRATION]);
      version=24;
    }else if(!applied(CAPACITY_ACTUAL_MIGRATION,CAPACITY_ACTUAL_MIGRATION_SQL)){
      throw new Error("smn-schema-incompatible");
    }
    const actualColumns=await client.query<{count:string}>(`
      SELECT count(*)::text AS count FROM information_schema.columns
      WHERE table_schema='public' AND
      ((table_name='smn_capacity_actual_override' AND column_name IN
       ('id','period_id','manual_jh','revision','updated_by','updated_at'))
      OR (table_name='smn_capacity_actual_override_history' AND column_name IN
       ('id','actual_id','revision','operation','before_jh','after_jh','changed_by','changed_at'))
      OR (table_name='smn_capacity_actual_snapshot' AND column_name IN
       ('id','period_id','event_id','retained_jh','reference_jh','provenance','closed_at','recorded_at','closed_by'))) `);
    if(actualColumns.rows[0]?.count!=="23")throw new Error("smn-schema-incompatible");
    if(version===24){
      await client.query(CAPACITY_HISTORICAL_MIGRATION_SQL);
      await client.query(`INSERT INTO public._prisma_migrations
        (id,checksum,finished_at,migration_name,applied_steps_count)
        VALUES($1,$2,now(),$3,1)`,
        [randomUUID(),checksum(CAPACITY_HISTORICAL_MIGRATION_SQL),CAPACITY_HISTORICAL_MIGRATION]);
      version=25;
    }else if(!applied(CAPACITY_HISTORICAL_MIGRATION,CAPACITY_HISTORICAL_MIGRATION_SQL)){
      throw new Error("smn-schema-incompatible");
    }
    const historicalColumns=await client.query<{count:string}>(`
      SELECT count(*)::text AS count FROM information_schema.columns
      WHERE table_schema='public' AND (
       (table_name='smn_capacity_historical_quality' AND column_name IN
        ('id','team_id','start_on','end_on','quality','qualified_jh',
         'source_kind','source_ref','rationale','revision','updated_by','updated_at'))
       OR (table_name='smn_capacity_historical_quality_history' AND column_name IN
        ('id','qualification_id','revision','before_values','after_values',
         'changed_by','changed_at'))
      )`);
    if(historicalColumns.rows[0]?.count!=="19")throw new Error("smn-schema-incompatible");
    if(version===25){
      await client.query(CAPACITY_REPLANNING_MIGRATION_SQL);
      await client.query(`INSERT INTO public._prisma_migrations
        (id,checksum,finished_at,migration_name,applied_steps_count)
        VALUES($1,$2,now(),$3,1)`,
        [randomUUID(),checksum(CAPACITY_REPLANNING_MIGRATION_SQL),CAPACITY_REPLANNING_MIGRATION]);
      version=26;
    }else if(!applied(CAPACITY_REPLANNING_MIGRATION,CAPACITY_REPLANNING_MIGRATION_SQL)){
      throw new Error("smn-schema-incompatible");
    }
    const replanningColumns=await client.query<{count:string}>(`
      SELECT count(*)::text AS count FROM information_schema.columns
      WHERE table_schema='public' AND (
       (table_name='smn_capacity_replanning' AND column_name IN
        ('id','period_id','target_start_on','target_end_on','revision',
         'confirmed_by','confirmed_at'))
       OR (table_name='smn_capacity_replanning_history' AND column_name IN
        ('id','replanning_id','revision','event_id','previous_values',
         'confirmed_values','preview_digest','confirmed_by','confirmed_at'))
      )`);
    if(replanningColumns.rows[0]?.count!=="16")throw new Error("smn-schema-incompatible");
    if(version>=27){
      const identityColumns=await client.query<{count:string}>(`
        SELECT count(*)::text AS count FROM information_schema.columns
        WHERE table_schema='public' AND (
          (table_name='smn_member' AND column_name='professional_function')
          OR (table_name='smn_member_identity_history' AND column_name IN
            ('id','member_id','previous_values','next_values','changed_by','changed_at'))
        )`);
      assertIdentityMigrationValid(
        version,
        applied(MEMBER_IDENTITY_MIGRATION,MEMBER_IDENTITY_MIGRATION_SQL),
        identityColumns.rows[0]?.count,
      );
    }
    if(version>=28){
      const integrity=await client.query<{product_nullable:boolean;indexes_valid:boolean;constraints_valid:boolean;old_unique_gone:boolean}>(`
        SELECT
          (SELECT is_nullable='YES' FROM information_schema.columns
            WHERE table_schema='public' AND table_name='smn_team'
              AND column_name='product_id') AS product_nullable,
          (SELECT count(*)=2 FROM pg_indexes
            WHERE schemaname='public' AND indexname IN
              ('smn_team_product_id_key','smn_team_installation_name_ci_key')
              AND indexdef ILIKE '%UNIQUE%') AS indexes_valid,
          (SELECT count(*)=6 FROM pg_constraint
            WHERE connamespace='public'::regnamespace AND conname IN
              ('smn_product_id_installation_pair_key',
               'smn_team_product_same_installation_fk',
               'smn_account_installation_pair_key',
               'smn_team_installation_pair_key',
               'smn_team_pref_account_same_installation_fk',
               'smn_team_pref_team_same_installation_fk')) AS constraints_valid,
          NOT EXISTS(SELECT 1 FROM pg_constraint
            WHERE connamespace='public'::regnamespace AND conname IN
              ('smn_product_installation_id_key','smn_team_installation_id_key')) AS old_unique_gone
      `);
      const row=integrity.rows[0];
      assertMultiTeamMigrationValid(version,
        applied(MULTI_TEAM_MIGRATION,MULTI_TEAM_SCHEMA_SQL),
        !!row?.product_nullable&&!!row?.indexes_valid&&
        !!row?.constraints_valid&&!!row?.old_unique_gone&&
        (await client.query<{present:boolean}>(
          "SELECT to_regclass('public.smn_account_team_preference') IS NOT NULL AS present"
        )).rows[0]?.present===true);
    }
    if(version===29){
      const checks=await client.query<{valid:boolean}>(`
       SELECT
       (SELECT count(*)=3 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='smn_team'
         AND column_name IN ('agile_mode','is_archived','mode_locked'))
       AND EXISTS(SELECT 1 FROM pg_constraint WHERE conname='smn_team_agile_mode_check'
        AND conrelid='public.smn_team'::regclass AND convalidated)
       AND EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='smn_sprint_lock_team_agile'
        AND tgrelid='public.smn_sprint'::regclass AND tgenabled='O')
       AND EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='smn_guard_team_agile_mode_before_update'
        AND tgrelid='public.smn_team'::regclass AND tgenabled='O')
       AS valid
      `);
      if(!applied(TEAM_AGILE_MIGRATION,TEAM_AGILE_MIGRATION_SQL)||checks.rows[0]?.valid!==true)
       throw new Error("smn-schema-incompatible");
    }
    await client.query("COMMIT");
  } catch(error) {
    await client.query("ROLLBACK").catch(()=>undefined);
    throw error;
  }
}
