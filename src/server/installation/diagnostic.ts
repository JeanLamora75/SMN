import { createHash } from "node:crypto";
import { INITIAL_MIGRATION, INSTALLATION_RELATIONS } from "./contract";
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
export type DiagnosticStatus = "configuration-missing" | "configuration-invalid" | "configuration-key-missing" | "database-missing" | "connection-error" | "permissions-insufficient" | "server-version-unsupported" | "virgin" | "initialized" | "schema-incompatible" | "installation-incomplete";
export type Diagnostic = Readonly<{ status: DiagnosticStatus; canEnterSetup: boolean }>;
export type Migration = Readonly<{ migration_name: string; checksum?: string; finished_at: Date | null; rolled_back_at: Date | null }>;
export type Snapshot = Readonly<{ schemaUsage: boolean; schemaCreate?: boolean; serverVersion?: number; tables: readonly string[]; tableRead?: boolean; migrationsRead?: boolean; migrations?: readonly Migration[]; installations?: readonly { id: string; state: string; schema_version: number }[]; shapeValid?: boolean; accountActiveColumn?: boolean; recoverySchemaValid?: boolean; settingsSchemaValid?: boolean; configurationTasksSchemaValid?: boolean;paletteSchemaValid?: boolean;accountAuditSchemaValid?:boolean;backupRetentionSchemaValid?:boolean;membersSchemaValid?:boolean;memberProfileSchemaValid?:boolean;assignmentVersionsSchemaValid?:boolean }>;
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
  if (![1,2,3,4,5,6,7,8,9,10,11].includes(records[0].schema_version)) return result("schema-incompatible");
  if (records[0].state !== "initialized") return result("installation-incomplete");
  if (!INSTALLATION_RELATIONS.slice(0,5).every((name) => names.has(name)) || !snapshot.migrationsRead || !snapshot.shapeValid) return result("installation-incomplete");
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
  return result("initialized");
}
export async function diagnoseInstallation(probe: DiagnosticProbe): Promise<Diagnostic> { try { return classifySnapshot(await probe()); } catch (error) { return result(classifyDatabaseError(error)); } }
