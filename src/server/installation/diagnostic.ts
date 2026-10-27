import { createHash } from "node:crypto";
import { INITIAL_MIGRATION, INITIAL_REQUIRED_RELATIONS, INSTALLATION_RELATIONS } from "./contract";
import { INITIAL_SCHEMA_SQL } from "./migration";
import { ACCOUNTS_MIGRATION, ACCOUNTS_MIGRATION_SQL } from "../accounts/migration";
import { RECOVERY_MIGRATION, RECOVERY_MIGRATION_SQL } from "../accounts/recovery-migration";
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
export type DiagnosticStatus = "configuration-missing" | "configuration-invalid" | "configuration-key-missing" | "database-missing" | "connection-error" | "permissions-insufficient" | "server-version-unsupported" | "virgin" | "initialized" | "schema-incompatible" | "installation-incomplete";
export type Diagnostic = Readonly<{ status: DiagnosticStatus; canEnterSetup: boolean }>;
export type Migration = Readonly<{ migration_name: string; checksum?: string; finished_at: Date | null; rolled_back_at: Date | null }>;
export type Snapshot = Readonly<{ schemaUsage: boolean; schemaCreate?: boolean; serverVersion?: number; tables: readonly string[]; tableRead?: boolean; migrationsRead?: boolean; migrations?: readonly Migration[]; installations?: readonly { id: string; state: string; schema_version: number }[]; shapeValid?: boolean; accountActiveColumn?: boolean; recoverySchemaValid?: boolean; settingsSchemaValid?: boolean; configurationTasksSchemaValid?: boolean;paletteSchemaValid?: boolean;accountAuditSchemaValid?:boolean;backupRetentionSchemaValid?:boolean;membersSchemaValid?:boolean;memberProfileSchemaValid?:boolean;assignmentVersionsSchemaValid?:boolean;lifecycleSchemaValid?:boolean;memberCalendarSchemaValid?:boolean;memberLocationSchemaValid?:boolean;countriesSchemaValid?:boolean;holidaysSchemaValid?:boolean;holidayCsvSchemaValid?:boolean;absencesSchemaValid?:boolean;closuresSchemaValid?:boolean;capacitySchemaValid?:boolean;capacityOverrideSchemaValid?:boolean;capacityInitialSchemaValid?:boolean;capacityActualSchemaValid?:boolean;capacityHistoricalSchemaValid?:boolean;capacityReplanningSchemaValid?:boolean;memberIdentitySchemaValid?:boolean;multiTeamSchemaValid?:boolean }>;
export type DiagnosticProbe = () => Promise<Snapshot>;
function result(status: DiagnosticStatus): Diagnostic { return { status, canEnterSetup: status === "virgin" }; }
export function classifyDatabaseError(error: unknown): DiagnosticStatus {
  const code = typeof error === "object" && error !== null && "code" in error ? (error as { code?: unknown }).code : undefined;
  if (code === "3D000") return "database-missing";
  if (code === "42501") return "permissions-insufficient";
  if (["42P01", "42703", "42883", "3F000", "42P07", "42809"].includes(String(code))) return "schema-incompatible";
  return "connection-error";
}
export function classifySnapshot(snapshot: Snapshot): Diagnostic {
  if (!snapshot.schemaUsage) return result("permissions-insufficient");
  if (!Number.isInteger(snapshot.serverVersion) || Math.floor(snapshot.serverVersion! / 10000) !== 18) return result("server-version-unsupported");
  const names = new Set(snapshot.tables);
  if (!names.has("public.smn_installation:r")) {
    if (names.size === 0) return result(snapshot.schemaCreate === true ? "virgin" : "permissions-insufficient");
    return result(names.size === 1 && names.has("public._prisma_migrations:r") ? "installation-incomplete" : "schema-incompatible");
  }
  if ([...names].some((name) => !(INSTALLATION_RELATIONS as readonly string[]).includes(name))) return result("schema-incompatible");
  if (!snapshot.tableRead) return result("permissions-insufficient");
  const records = snapshot.installations;
  if (!records?.length || records.length !== 1 || records[0].id !== "singleton") return result("installation-incomplete");
  if (![1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28].includes(records[0].schema_version)) return result("schema-incompatible");
  if (records[0].state !== "initialized") return result("installation-incomplete");
  if (!INITIAL_REQUIRED_RELATIONS.every((name) => names.has(name)) || !snapshot.migrationsRead || !snapshot.shapeValid) return result("installation-incomplete");
  const migrations = snapshot.migrations;
  const isV2 = records[0].schema_version >= 2;
  const isV3 = records[0].schema_version >= 3;
  const isV4 = records[0].schema_version >= 4;
  const isV5 = records[0].schema_version >= 5;
  const isV6 = records[0].schema_version >= 6;
  const isV7 = records[0].schema_version >= 7;
  const isV8 = records[0].schema_version >= 8;
  const isV9 = records[0].schema_version >= 9;
  const isV10 = records[0].schema_version >= 10;
  const isV11 = records[0].schema_version >= 11;
  const isV12 = records[0].schema_version >= 12;
  const isV13 = records[0].schema_version >= 13;
  const isV14 = records[0].schema_version >= 14;
  const isV15 = records[0].schema_version >= 15;
  const isV16 = records[0].schema_version >= 16;
  const isV17 = records[0].schema_version >= 17;
  const isV18 = records[0].schema_version >= 18;
  const isV19 = records[0].schema_version >= 19;
  const isV20 = records[0].schema_version >= 20;
  const isV21 = records[0].schema_version >= 21;
  const isV22 = records[0].schema_version >= 22;
  const isV23 = records[0].schema_version >= 23;
  const isV24 = records[0].schema_version >= 24;
  const isV25 = records[0].schema_version >= 25;
  const isV26 = records[0].schema_version >= 26;
  const isV27 = records[0].schema_version >= 27;
  const isV28 = records[0].schema_version >= 28;
  if (migrations?.length !== records[0].schema_version) return result("installation-incomplete");
  const base = migrations.find(m => m.migration_name === INITIAL_MIGRATION);
  if (!base || base.checksum !== createHash("sha256").update(INITIAL_SCHEMA_SQL).digest("hex") ||
      !base.finished_at || base.rolled_back_at) return result("installation-incomplete");
  if (isV2) {
    const next = migrations.find(m => m.migration_name === ACCOUNTS_MIGRATION);
    if (!next || next.checksum !== createHash("sha256").update(ACCOUNTS_MIGRATION_SQL).digest("hex") ||
        !next.finished_at || next.rolled_back_at || !snapshot.accountActiveColumn)
      return result("installation-incomplete");
  }
  if (isV3) {
    const third = migrations.find(m=>m.migration_name === RECOVERY_MIGRATION);
    if (!third || third.checksum !== createHash("sha256").update(RECOVERY_MIGRATION_SQL).digest("hex") ||
        !third.finished_at || third.rolled_back_at || !snapshot.recoverySchemaValid ||
        !names.has("public.smn_recovery_phrase:r") || !names.has("public.smn_auth_audit:r"))
      return result("installation-incomplete");
  }
  if (isV4) {
    const fourth=migrations.find(m=>m.migration_name === SETTINGS_MIGRATION);
    if (!fourth || fourth.checksum!==createHash("sha256").update(SETTINGS_MIGRATION_SQL).digest("hex") ||
        !fourth.finished_at || fourth.rolled_back_at || !snapshot.settingsSchemaValid ||
        !names.has("public.smn_general_settings:r") || !names.has("public.smn_general_settings_audit:r"))
      return result("installation-incomplete");
  }
  if (isV5) {
    const fifth=migrations.find(m=>m.migration_name===CONFIGURATION_MIGRATION);
    if (!fifth || fifth.checksum!==createHash("sha256").update(CONFIGURATION_MIGRATION_SQL).digest("hex") ||
        !fifth.finished_at || fifth.rolled_back_at || !snapshot.configurationTasksSchemaValid ||
        !names.has("public.smn_configuration_task:r")) return result("installation-incomplete");
  }
  if (isV6) {
    const sixth=migrations.find(m=>m.migration_name===APPEARANCE_MIGRATION);
    if(!sixth||sixth.checksum!==createHash("sha256").update(APPEARANCE_MIGRATION_SQL).digest("hex")||
      !sixth.finished_at||sixth.rolled_back_at||!snapshot.paletteSchemaValid)
      return result("installation-incomplete");
  }
  if (isV7) {
    const seventh=migrations.find(m=>m.migration_name===ACCOUNT_AUDIT_MIGRATION);
    if(!seventh||seventh.checksum!==createHash("sha256").update(ACCOUNT_AUDIT_MIGRATION_SQL).digest("hex")||
      !seventh.finished_at||seventh.rolled_back_at||!snapshot.accountAuditSchemaValid||
      !names.has("public.smn_account_audit:r"))return result("installation-incomplete");
  }
  if (isV8) {
    const eighth=migrations.find(m=>m.migration_name===BACKUP_RETENTION_MIGRATION);
    if(!eighth||eighth.checksum!==createHash("sha256").update(BACKUP_RETENTION_MIGRATION_SQL).digest("hex")||
      !eighth.finished_at||eighth.rolled_back_at||!snapshot.backupRetentionSchemaValid||
      !names.has("public.smn_backup_retention:r")||
      !names.has("public.smn_backup_retention_audit:r"))
      return result("installation-incomplete");
  }
  if (isV9) {
    const ninth=migrations.find(m=>m.migration_name===MEMBERS_MIGRATION);
    if(!ninth||ninth.checksum!==createHash("sha256").update(MEMBERS_MIGRATION_SQL).digest("hex")||
      !ninth.finished_at||ninth.rolled_back_at||!snapshot.membersSchemaValid||
      !names.has("public.smn_member_batch:r")||
      !names.has("public.smn_member:r")||
      !names.has("public.smn_member_assignment:r"))
       return result("installation-incomplete");
  }
  if (isV10) {
    const tenth=migrations.find(m=>m.migration_name===MEMBER_PROFILE_MIGRATION);
    if(!tenth||tenth.checksum!==createHash("sha256").update(MEMBER_PROFILE_MIGRATION_SQL).digest("hex")||
      !tenth.finished_at||tenth.rolled_back_at||!snapshot.memberProfileSchemaValid)
      return result("installation-incomplete");
  }
  if (isV11) {
    const eleventh=migrations.find(m=>m.migration_name===ASSIGNMENT_MIGRATION);
    if(!eleventh||eleventh.checksum!==createHash("sha256").update(ASSIGNMENT_MIGRATION_SQL).digest("hex")||
      !eleventh.finished_at||eleventh.rolled_back_at||!snapshot.assignmentVersionsSchemaValid||
      !names.has("public.smn_member_assignment_version:r"))return result("installation-incomplete");
  }
  if(isV12){
    const twelfth=migrations.find(m=>m.migration_name===LIFECYCLE_MIGRATION);
    if(!twelfth||twelfth.checksum!==createHash("sha256").update(LIFECYCLE_MIGRATION_SQL).digest("hex")||
       !twelfth.finished_at||twelfth.rolled_back_at||!snapshot.lifecycleSchemaValid||
       !names.has("public.smn_member_lifecycle_event:r"))return result("installation-incomplete");
  }
  if(isV13){
    const thirteenth=migrations.find(m=>m.migration_name===MEMBER_CALENDAR_MIGRATION);
    if(!thirteenth||thirteenth.checksum!==createHash("sha256").update(MEMBER_CALENDAR_MIGRATION_SQL).digest("hex")||
       !thirteenth.finished_at||thirteenth.rolled_back_at||!snapshot.memberCalendarSchemaValid||
       !names.has("public.smn_member_calendar_week:r")||
       !names.has("public.smn_member_calendar_exception:r"))
      return result("installation-incomplete");
  }
  if(isV14){
    const migration=migrations.find(m=>m.migration_name===MEMBER_LOCATION_MIGRATION);
    if(!migration||migration.checksum!==createHash("sha256").update(MEMBER_LOCATION_MIGRATION_SQL).digest("hex")||
     !migration.finished_at||migration.rolled_back_at||!snapshot.memberLocationSchemaValid||
     !names.has("public.smn_member_location:r"))return result("installation-incomplete");
  }
  if(isV15){
    const migration=migrations.find(m=>m.migration_name===COUNTRIES_MIGRATION);
    if(!migration||migration.checksum!==createHash("sha256").update(COUNTRIES_MIGRATION_SQL).digest("hex")||
      !migration.finished_at||migration.rolled_back_at||!snapshot.countriesSchemaValid||
      !names.has("public.smn_country:r"))return result("installation-incomplete");
  }
  if(isV16){
    const migration=migrations.find(m=>m.migration_name===HOLIDAYS_MIGRATION);
    if(!migration||migration.checksum!==createHash("sha256").update(HOLIDAYS_MIGRATION_SQL).digest("hex")||
      !migration.finished_at||migration.rolled_back_at||!snapshot.holidaysSchemaValid||
      !names.has("public.smn_national_holiday:r")||
      !names.has("public.smn_national_calendar_coverage:r"))return result("installation-incomplete");
  }
  if(isV17){
    const migration=migrations.find(m=>m.migration_name===HOLIDAY_CSV_MIGRATION);
    if(!migration||migration.checksum!==createHash("sha256").update(HOLIDAY_CSV_MIGRATION_SQL).digest("hex")||
      !migration.finished_at||migration.rolled_back_at||!snapshot.holidayCsvSchemaValid||
      !names.has("public.smn_national_holiday_audit:r"))return result("installation-incomplete");
  }
  if(isV18){
    const migration=migrations.find(m=>m.migration_name===HOLIDAY_ICS_MIGRATION);
    if(!migration||migration.checksum!==createHash("sha256").update(HOLIDAY_ICS_MIGRATION_SQL).digest("hex")||
      !migration.finished_at||migration.rolled_back_at||!snapshot.holidayCsvSchemaValid||
      !names.has("public.smn_national_holiday_audit:r"))return result("installation-incomplete");
  }
  if(isV19){
    const migration=migrations.find(m=>m.migration_name===ABSENCE_MIGRATION);
    if(!migration||migration.checksum!==createHash("sha256").update(ABSENCE_MIGRATION_SQL).digest("hex")||
     !migration.finished_at||migration.rolled_back_at||!snapshot.absencesSchemaValid||
     !names.has("public.smn_absence_category:r")||
     !names.has("public.smn_member_absence:r")||
     !names.has("public.smn_member_absence_history:r"))
      return result("installation-incomplete");
  }
  if(isV20){
    const migration=migrations.find(m=>m.migration_name===CLOSURES_MIGRATION);
    if(!migration||migration.checksum!==createHash("sha256").update(CLOSURES_MIGRATION_SQL).digest("hex")||
     !migration.finished_at||migration.rolled_back_at||!snapshot.closuresSchemaValid||
     !names.has("public.smn_company_closure:r")||
     !names.has("public.smn_company_closure_history:r"))
      return result("installation-incomplete");
  }
  if(isV21){
    const migration=migrations.find(m=>m.migration_name===CAPACITY_MIGRATION);
    if(!migration||migration.checksum!==createHash("sha256").update(CAPACITY_MIGRATION_SQL).digest("hex")||
     !migration.finished_at||migration.rolled_back_at||!snapshot.capacitySchemaValid||
     !names.has("public.smn_capacity_settings:r")||
     !names.has("public.smn_capacity_settings_audit:r"))
      return result("installation-incomplete");
  }
  if(isV22){
    const migration=migrations.find(m=>m.migration_name===CAPACITY_OVERRIDE_MIGRATION);
    if(!migration||migration.checksum!==createHash("sha256").update(CAPACITY_OVERRIDE_MIGRATION_SQL).digest("hex")||
     !migration.finished_at||migration.rolled_back_at||!snapshot.capacityOverrideSchemaValid||
     !names.has("public.smn_capacity_period_override:r")||
     !names.has("public.smn_capacity_period_override_history:r"))
      return result("installation-incomplete");
  }
  if(isV23){
    const migration=migrations.find(m=>m.migration_name===CAPACITY_INITIAL_MIGRATION);
    if(!migration||migration.checksum!==createHash("sha256").update(CAPACITY_INITIAL_MIGRATION_SQL).digest("hex")||
     !migration.finished_at||migration.rolled_back_at||!snapshot.capacityInitialSchemaValid||
     !names.has("public.smn_capacity_initial_snapshot:r"))
      return result("installation-incomplete");
  }
  if(isV24){
    const migration=migrations.find(m=>m.migration_name===CAPACITY_ACTUAL_MIGRATION);
    if(!migration||migration.checksum!==createHash("sha256").update(CAPACITY_ACTUAL_MIGRATION_SQL).digest("hex")||
      !migration.finished_at||migration.rolled_back_at||!snapshot.capacityActualSchemaValid||
      !names.has("public.smn_capacity_actual_override:r")||
      !names.has("public.smn_capacity_actual_override_history:r")||
      !names.has("public.smn_capacity_actual_snapshot:r"))
      return result("installation-incomplete");
  }
  if(isV25){
    const migration=migrations.find(m=>m.migration_name===CAPACITY_HISTORICAL_MIGRATION);
    if(!migration||migration.checksum!==createHash("sha256").update(CAPACITY_HISTORICAL_MIGRATION_SQL).digest("hex")||
     !migration.finished_at||migration.rolled_back_at||!snapshot.capacityHistoricalSchemaValid||
     !names.has("public.smn_capacity_historical_quality:r")||
     !names.has("public.smn_capacity_historical_quality_history:r"))
      return result("installation-incomplete");
  }
  if(isV26){
    const migration=migrations.find(m=>m.migration_name===CAPACITY_REPLANNING_MIGRATION);
    if(!migration||migration.checksum!==createHash("sha256").update(CAPACITY_REPLANNING_MIGRATION_SQL).digest("hex")||
     !migration.finished_at||migration.rolled_back_at||!snapshot.capacityReplanningSchemaValid||
     !names.has("public.smn_capacity_replanning:r")||
     !names.has("public.smn_capacity_replanning_history:r"))
      return result("installation-incomplete");
  }
  if(isV27){
    const migration=migrations.find(m=>m.migration_name===MEMBER_IDENTITY_MIGRATION);
    if(!migration||migration.checksum!==createHash("sha256").update(MEMBER_IDENTITY_MIGRATION_SQL).digest("hex")||
      !migration.finished_at||migration.rolled_back_at||!snapshot.memberIdentitySchemaValid)
      return result("installation-incomplete");
  }
  if(isV28){
    const migration=migrations.find(m=>m.migration_name===MULTI_TEAM_MIGRATION);
    if(!migration||
       migration.checksum!==createHash("sha256").update(MULTI_TEAM_SCHEMA_SQL).digest("hex")||
       !migration.finished_at||migration.rolled_back_at||
       !snapshot.multiTeamSchemaValid||
       !names.has("public.smn_team_context:r")||
       !names.has("public.smn_team_context_audit:r")||
       !names.has("public.smn_account_team_preference:r"))
      return result("installation-incomplete");
  }
  return result("initialized");
}
export async function diagnoseInstallation(probe: DiagnosticProbe): Promise<Diagnostic> { try { return classifySnapshot(await probe()); } catch (error) { return result(classifyDatabaseError(error)); } }
