import { createHash } from "node:crypto";
import { INITIAL_MIGRATION, INSTALLATION_RELATIONS } from "./contract";
import { INITIAL_SCHEMA_SQL } from "./migration";
import { ACCOUNTS_MIGRATION, ACCOUNTS_MIGRATION_SQL } from "../accounts/migration";
import { RECOVERY_MIGRATION, RECOVERY_MIGRATION_SQL } from "../accounts/recovery-migration";
import { SETTINGS_MIGRATION, SETTINGS_MIGRATION_SQL } from "../settings/migration";
import { CONFIGURATION_MIGRATION, CONFIGURATION_MIGRATION_SQL } from "../configuration/migration";
export type DiagnosticStatus = "configuration-missing" | "configuration-invalid" | "database-missing" | "connection-error" | "permissions-insufficient" | "server-version-unsupported" | "virgin" | "initialized" | "schema-incompatible" | "installation-incomplete";
export type Diagnostic = Readonly<{ status: DiagnosticStatus; canEnterSetup: boolean }>;
export type Migration = Readonly<{ migration_name: string; checksum?: string; finished_at: Date | null; rolled_back_at: Date | null }>;
export type Snapshot = Readonly<{ schemaUsage: boolean; schemaCreate?: boolean; serverVersion?: number; tables: readonly string[]; tableRead?: boolean; migrationsRead?: boolean; migrations?: readonly Migration[]; installations?: readonly { id: string; state: string; schema_version: number }[]; shapeValid?: boolean; accountActiveColumn?: boolean; recoverySchemaValid?: boolean; settingsSchemaValid?: boolean; configurationTasksSchemaValid?: boolean }>;
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
  if (![1,2,3,4,5].includes(records[0].schema_version)) return result("schema-incompatible");
  if (records[0].state !== "initialized") return result("installation-incomplete");
  if (!INSTALLATION_RELATIONS.slice(0,5).every((name) => names.has(name)) || !snapshot.migrationsRead || !snapshot.shapeValid) return result("installation-incomplete");
  const migrations = snapshot.migrations;
  const isV2 = records[0].schema_version >= 2;
  const isV3 = records[0].schema_version >= 3;
  const isV4 = records[0].schema_version >= 4;
  const isV5 = records[0].schema_version === 5;
  if (migrations?.length !== (isV5 ? 5 : isV4 ? 4 : isV3 ? 3 : isV2 ? 2 : 1)) return result("installation-incomplete");
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
  return result("initialized");
}
export async function diagnoseInstallation(probe: DiagnosticProbe): Promise<Diagnostic> { try { return classifySnapshot(await probe()); } catch (error) { return result(classifyDatabaseError(error)); } }
