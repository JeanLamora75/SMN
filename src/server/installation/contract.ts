export const INITIAL_MIGRATION = "20261020_smn12_initial";
export const INSTALLATION_RELATIONS = [
  "public._prisma_migrations:r", "public.smn_installation:r", "public.smn_product:r",
  "public.smn_team:r", "public.smn_account:r", "public.smn_recovery_phrase:r", "public.smn_auth_audit:r",
  "public.smn_general_settings:r", "public.smn_general_settings_audit:r",
  "public.smn_configuration_task:r", "public.smn_account_audit:r",
  "public.smn_backup_retention:r", "public.smn_backup_retention_audit:r",
  "public.smn_member_batch:r", "public.smn_member:r", "public.smn_member_assignment:r",
  "public.smn_member_assignment_version:r", "public.smn_member_lifecycle_event:r",
  "public.smn_member_calendar_week:r", "public.smn_member_calendar_exception:r",
  "public.smn_member_location:r", "public.smn_country:r",
  "public.smn_national_holiday:r", "public.smn_national_calendar_coverage:r",
  "public.smn_national_holiday_audit:r",
  "public.smn_absence_category:r", "public.smn_member_absence:r",
  "public.smn_member_absence_history:r",
  "public.smn_company_closure:r", "public.smn_company_closure_history:r",
  "public.smn_capacity_settings:r", "public.smn_capacity_settings_audit:r",
] as const;
export type ExpressInput = Readonly<{ mode: "scrum" | "kanban"; product: string; team: string; password: string; adminUsername: string; adminEmail: string }>;
export function validateExpressInput(body: unknown): ExpressInput | null {
  if (!body || typeof body !== "object") return null;
  const v = body as Record<string, unknown>;
  if (v.mode !== "scrum" && v.mode !== "kanban") return null;
  const product = typeof v.product === "string" ? v.product.trim() : "";
  const team = typeof v.team === "string" ? v.team.trim() : "";
  const password = v.password;
  const adminUsername = typeof v.adminUsername === "string" ? v.adminUsername.trim() : "admin";
  const adminEmail = typeof v.adminEmail === "string" ? v.adminEmail.trim().toLowerCase() : "admin@localhot.com";
  if (product.length < 1 || product.length > 120 || team.length < 1 || team.length > 120 ||
      typeof password !== "string" || password.length < 4 || password.length > 256 ||
      !/^[a-zA-Z0-9_.-]{2,50}$/.test(adminUsername) ||
      !/^[^\s@]{1,80}@[^\s@]{1,100}\.[^\s@]{2,20}$/.test(adminEmail)) return null;
  return { mode: v.mode, product, team, password, adminUsername, adminEmail };
}
