export const INITIAL_MIGRATION = "20261020_smn12_initial";
/** The five foundational installation relations; optional feature tables never belong here. */
export const INITIAL_REQUIRED_RELATIONS = [
  "public._prisma_migrations:r", "public.smn_installation:r",
  "public.smn_product:r", "public.smn_team:r", "public.smn_account:r"
] as const;
export const INSTALLATION_RELATIONS = [
  "public._prisma_migrations:r", "public.smn_installation:r", "public.smn_product:r",
  "public.smn_team:r", "public.smn_account:r", "public.smn_recovery_phrase:r", "public.smn_auth_audit:r",
  "public.smn_team_context:r", "public.smn_team_context_audit:r",
  "public.smn_general_settings:r", "public.smn_general_settings_audit:r",
  "public.smn_configuration_task:r", "public.smn_account_audit:r",
  "public.smn_backup_retention:r", "public.smn_backup_retention_audit:r",
  "public.smn_member_batch:r", "public.smn_member:r", "public.smn_member_assignment:r",
  "public.smn_member_identity_history:r",
  "public.smn_member_assignment_version:r", "public.smn_member_lifecycle_event:r",
  "public.smn_member_assignment_start_audit:r",
  "public.smn_member_calendar_week:r", "public.smn_member_calendar_exception:r",
  "public.smn_member_location:r", "public.smn_country:r",
  "public.smn_national_holiday:r", "public.smn_national_calendar_coverage:r",
  "public.smn_national_holiday_audit:r",
  "public.smn_absence_category:r", "public.smn_member_absence:r",
  "public.smn_member_absence_history:r",
  "public.smn_company:r",
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
  // Historique natif créé au premier déplacement manuel d’une occurrence dans le calendrier.
  "public.smn_calendar_meeting_schedule_history:r",
  "public.smn_calendar_meeting_outcome_link:r",
  "public.smn_meeting_actual_duration_audit:r",
  "public.smn_exceptional_capacity_impact_history:r",
  "public.smn_sprint_goal:r",
  "public.smn_sprint_goal_audit:r",
  "public.smn_sprint_story_points:r",
  "public.smn_sprint_story_points_audit:r",
  "public.smn_sprint_scores:r", "public.smn_sprint_scores_audit:r",
  "public.smn_sprint_capacity_kpi:r", "public.smn_sprint_capacity_kpi_audit:r",
  "public.smn_registry_item:r", "public.smn_registry_item_audit:r",
  "public.smn_registry_cycle_link:r", "public.smn_registry_cycle_link_audit:r",
  "public.smn_risk_roam:r", "public.smn_risk_roam_audit:r",
  "public.smn_risk_assessment:r", "public.smn_risk_assessment_audit:r",
  "public.smn_dashboard_note:r", "public.smn_dashboard_note_audit:r",
  "public.smn_dashboard_note_edit_audit:r", "public.smn_dashboard_event_edit_audit:r",
  // Tables SMN différées : créées seulement au premier usage d'une fonctionnalité autorisée.
  // Leur présence n'indique ni une base tierce ni une migration incomplète.
  "public.smn_automatic_highlight:r", "public.smn_automatic_highlight_settings:r",
  "public.smn_registry_deadline_settings:r",
  "public.smn_action_link:r", "public.smn_action_link_audit:r",
  "public.smn_dependency_vigilance:r", "public.smn_dependency_vigilance_audit:r",
  "public.smn_fact_selection:r", "public.smn_fact_selection_audit:r",
  "public.smn_registry_relation:r", "public.smn_registry_relation_audit:r",
  "public.smn_decision_detail:r", "public.smn_decision_detail_audit:r",
  "public.smn_dependency_parties:r", "public.smn_dependency_parties_audit:r",
  "public.smn_report_archive_grant:r", "public.smn_report_archive_visibility:r",
  "public.smn_report_history_options:r", "public.smn_report_logo:r",
  "public.smn_report_language:r", "public.smn_report_render_reference:r",
  "public.smn_report_pdf_archive:r",
  "public.smn_report_section_options:r", "public.smn_report_section_options_audit:r",
  "public.smn_report_team_context_options:r", "public.smn_report_template:r",
  "public.smn_report_content_options:r", "public.smn_report_content_options_audit:r",
  "public.smn_sprint_review_analysis:r", "public.smn_sprint_review_analysis_audit:r",
  "public.smn_report_draft:r", "public.smn_report_draft_audit:r",
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
  // Objets SQL appartenant à SMN, créés à la demande par les producteurs métier.
  // reports: seules les relations effectivement déclarées par le code source.
  "public.smn_report_document:r", "public.smn_report_document_session_write:r", "public.smn_report_analysis_choice:r",
  "public.smn_report_link_selection:r",
  // registries: seules les relations effectivement déclarées par le code source.
  "public.smn_registry_comment:r", "public.smn_registry_comment_revision:r", "public.smn_registry_linked_request:r",
  // historicalSprint: seules les relations effectivement déclarées par le code source.
  "public.smn_sprint_historical_event:r", "public.smn_sprint_historical_actual_capacity:r", "public.smn_sprint_historical_actual_capacity_audit:r",
  "public.smn_sprint_historical_capacity:r", "public.smn_sprint_historical_capacity_audit:r", "public.smn_sprint_historical_request:r",
  "public.smn_sprint_historical_goal_detail:r",
  // kanban: seules les relations effectivement déclarées par le code source.
  "public.smn_kanban_period:r", "public.smn_kanban_period_audit:r", "public.smn_kanban_report_analysis_choice:r",
  "public.smn_kanban_capacity_opening:r", "public.smn_kanban_period_transition:r",
  "public.smn_kanban_timing:r", "public.smn_kanban_timing_audit:r",
  "public.smn_kanban_closure:r", "public.smn_kanban_batch_audit:r", "public.smn_kanban_cadence:r",
  "public.smn_kanban_cadence_audit:r", "public.smn_kanban_flow_counts:r", "public.smn_kanban_flow_audit:r",
  "public.smn_kanban_goal:r", "public.smn_kanban_goal_audit:r", "public.smn_kanban_meeting:r",
  "public.smn_kanban_registry_link:r", "public.smn_kanban_registry_link_audit:r", "public.smn_kanban_render_reference:r",
  // ai: seules les relations effectivement déclarées par le code source.
  "public.smn_ai_brief_archive:r", "public.smn_ai_brief_draft:r", "public.smn_human_analysis:r",
  "public.smn_ai_brief_response:r", "public.smn_ai_brief_template:r",
  // historicalCsv: seules les relations effectivement déclarées par le code source.
  "public.smn_historical_csv_attempt:r", "public.smn_historical_csv_batch:r", "public.smn_historical_csv_change:r",
  "public.smn_account_team_preference:r",
  "public.smn_country_name_audit:r",
  "public.smn_country_lifecycle_audit:r",
  "public.smn_national_holiday_manual_audit:r",
  "public.smn_national_calendar_validation_audit:r",
  "public.smn_link_category:r", "public.smn_link:r", "public.smn_link_audit:r",
  "public.smn_ai_brief_archive_immutable:function",
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
