export const INITIAL_MIGRATION = "20261020_smn12_initial";
export const INSTALLATION_RELATIONS = [
  "public._prisma_migrations:r", "public.smn_installation:r", "public.smn_product:r",
  "public.smn_team:r", "public.smn_account:r", "public.smn_recovery_phrase:r", "public.smn_auth_audit:r",
  "public.smn_general_settings:r", "public.smn_general_settings_audit:r",
  "public.smn_configuration_task:r", "public.smn_account_audit:r",
  "public.smn_backup_retention:r", "public.smn_backup_retention_audit:r",
  "public.smn_member_batch:r", "public.smn_member:r", "public.smn_member_assignment:r",
  "public.smn_member_identity_history:r",
  "public.smn_member_assignment_version:r", "public.smn_member_lifecycle_event:r",
  "public.smn_member_calendar_week:r", "public.smn_member_calendar_exception:r",
  "public.smn_member_location:r", "public.smn_country:r",
  "public.smn_national_holiday:r", "public.smn_national_calendar_coverage:r",
  "public.smn_national_holiday_audit:r",
  "public.smn_absence_category:r", "public.smn_member_absence:r",
  "public.smn_member_absence_history:r",
  "public.smn_company_closure:r", "public.smn_company_closure_history:r",
  "public.smn_capacity_settings:r", "public.smn_capacity_settings_audit:r",
  "public.smn_capacity_period_override:r", "public.smn_capacity_period_override_history:r",
  "public.smn_capacity_initial_snapshot:r",
  "public.smn_capacity_actual_override:r",
  "public.smn_capacity_actual_override_history:r",
  "public.smn_capacity_actual_snapshot:r",
  "public.smn_capacity_historical_quality:r",
  "public.smn_capacity_historical_quality_history:r",
  "public.smn_capacity_replanning:r",
  "public.smn_capacity_replanning_history:r",
  "public.smn_scrum_cadence:r",
  "public.smn_scrum_cadence_audit:r",
  "public.smn_sprint:r",
  "public.smn_sprint_audit:r",
  "public.smn_sprint_reschedule_audit:r",
  "public.smn_sprint_batch_preview:r",
  "public.smn_sprint_wizard_preview:r",
  "public.smn_sprint_batch_audit:r",
  "public.smn_sprint_transition:r",
  "public.smn_sprint_capacity_trigger:r",
  "public.smn_sprint_ceremony:r",
  "public.smn_scrum_lunch:r",
  "public.smn_sprint_ceremony_segment:r",
  "public.smn_sprint_ceremony_history:r",
  "public.smn_scrum_ceremony_template:r",
  "public.smn_scrum_ceremony_template_history:r",
  "public.smn_scrum_template_occurrence:r",
  "public.smn_sprint_exceptional_meeting:r",
  "public.smn_sprint_exceptional_meeting_history:r",
  "public.smn_meeting_actual_duration_audit:r",
  "public.smn_exceptional_capacity_impact_history:r",
  "public.smn_sprint_goal:r",
  "public.smn_sprint_goal_audit:r",
  "public.smn_sprint_story_points:r",
  "public.smn_sprint_story_points_audit:r",
  "public.smn_sprint_ticket_counts:r",
  "public.smn_sprint_ticket_counts_audit:r",
  "public.smn_sprint_closure_snapshot:r",
  "public.smn_sprint_closure_audit:r",
  "public.smn_exceptional_meeting_participant:r",
  "public.smn_exceptional_meeting_participant_audit:r",
  "public.smn_team_work_slots:r",
  "public.smn_scrum_template_occurrence_status_history:r",
  "public.smn_sprint_ceremony_status_history:r",
  "public.smn_sprint_exceptional_meeting_status_history:r",
  "public.smn_initial_snapshot_immutable:function",
  "public.smn_reject_closure_snapshot_mutation:function",
  "public.smn_actual_snapshot_immutable:function",
  "public.smn_historical_quality_history_immutable:function",
  "public.smn_replanning_history_immutable:function",
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
