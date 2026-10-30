--
-- PostgreSQL database dump
--


-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS "public";


--
-- Name: SCHEMA "public"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA "public" IS 'standard public schema';


--
-- Name: smn_actual_snapshot_immutable(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."smn_actual_snapshot_immutable"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
 BEGIN
  RAISE EXCEPTION 'actual-capacity-snapshot-is-immutable';
 END;
 $$;


--
-- Name: smn_ai_brief_archive_immutable(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."smn_ai_brief_archive_immutable"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$ BEGIN

 RAISE EXCEPTION 'finalized AI brief archives are immutable';

 END $$;


--
-- Name: smn_historical_quality_history_immutable(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."smn_historical_quality_history_immutable"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
 BEGIN
  RAISE EXCEPTION 'historical-quality-audit-is-immutable';
 END;
 $$;


--
-- Name: smn_initial_snapshot_immutable(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."smn_initial_snapshot_immutable"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
 BEGIN
  RAISE EXCEPTION 'initial-capacity-snapshot-is-immutable';
 END;
 $$;


--
-- Name: smn_reject_studio_archive_snapshot_mutation(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."smn_reject_studio_archive_snapshot_mutation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$

BEGIN

 RAISE EXCEPTION 'studio archive snapshots are immutable';

END;

$$;


--
-- Name: smn_replanning_history_immutable(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."smn_replanning_history_immutable"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
 BEGIN
  RAISE EXCEPTION 'replanning-history-is-immutable';
 END;
 $$;


SET default_tablespace = '';

SET default_table_access_method = "heap";

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."_prisma_migrations" (
    "id" character varying(36) NOT NULL,
    "checksum" character varying(64) NOT NULL,
    "finished_at" timestamp with time zone,
    "migration_name" character varying(255) NOT NULL,
    "logs" "text",
    "rolled_back_at" timestamp with time zone,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "applied_steps_count" integer DEFAULT 0 NOT NULL
);


--
-- Name: smn_absence_category; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_absence_category" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "color" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_absence_category_color_check" CHECK (("color" ~ '^#[0-9A-Fa-f]{6}$'::"text")),
    CONSTRAINT "smn_absence_category_id_check" CHECK (("id" ~ '^[a-z][a-z0-9_-]{0,39}$'::"text")),
    CONSTRAINT "smn_absence_category_name_check" CHECK ((("char_length"("btrim"("name")) >= 1) AND ("char_length"("btrim"("name")) <= 100)))
);


--
-- Name: smn_account; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_account" (
    "id" "text" NOT NULL,
    "installation_id" "text" NOT NULL,
    "username" "text" NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" NOT NULL,
    "password_hash" "text" NOT NULL,
    "must_change_password" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    CONSTRAINT "smn_account_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'user'::"text"])))
);


--
-- Name: smn_account_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_account_audit" (
    "id" "text" NOT NULL,
    "installation_id" "text" NOT NULL,
    "actor_id" "text",
    "object_id" "text" NOT NULL,
    "action" "text" NOT NULL,
    "outcome" "text" DEFAULT 'success'::"text" NOT NULL,
    "old_values" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "new_values" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_account_audit_action_check" CHECK (("action" = ANY (ARRAY['account_created'::"text", 'account_updated'::"text"]))),
    CONSTRAINT "smn_account_audit_outcome_check" CHECK (("outcome" = 'success'::"text"))
);


--
-- Name: smn_account_team_preference; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_account_team_preference" (
    "account_id" "text" NOT NULL,
    "installation_id" "text" NOT NULL,
    "team_id" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_action_link; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_action_link" (
    "action_id" "text" NOT NULL,
    "related_id" "text" NOT NULL
);


--
-- Name: smn_action_link_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_action_link_audit" (
    "id" "text" NOT NULL,
    "action_id" "text" NOT NULL,
    "related_id" "text" NOT NULL,
    "action" "text" NOT NULL,
    "actor_id" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_action_link_audit_action_check" CHECK (("action" = ANY (ARRAY['linked'::"text", 'unlinked'::"text"])))
);


--
-- Name: smn_ai_brief_archive; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_ai_brief_archive" (
    "id" "uuid" NOT NULL,
    "mode" "text" NOT NULL,
    "cycle_id" "text" NOT NULL,
    "team_id" "text" NOT NULL,
    "template_id" "text" NOT NULL,
    "template_revision" integer NOT NULL,
    "author_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "sha256" "text" NOT NULL,
    "byte_length" integer NOT NULL,
    "content" "bytea" NOT NULL,
    "reviewed" boolean NOT NULL,
    "parent_archive_id" "uuid",
    CONSTRAINT "smn_ai_brief_archive_byte_length_check" CHECK (("byte_length" > 0)),
    CONSTRAINT "smn_ai_brief_archive_check" CHECK (("octet_length"("content") = "byte_length")),
    CONSTRAINT "smn_ai_brief_archive_mode_check" CHECK (("mode" = ANY (ARRAY['scrum'::"text", 'kanban'::"text"]))),
    CONSTRAINT "smn_ai_brief_archive_reviewed_check" CHECK (("reviewed" = true))
);


--
-- Name: smn_ai_brief_draft; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_ai_brief_draft" (
    "id" "uuid" NOT NULL,
    "parent_archive_id" "uuid" NOT NULL,
    "team_id" "text" NOT NULL,
    "mode" "text" NOT NULL,
    "cycle_id" "text" NOT NULL,
    "template_id" "text" NOT NULL,
    "template_revision" integer NOT NULL,
    "content" "text" NOT NULL,
    "revision" integer DEFAULT 1 NOT NULL,
    "created_by" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "finalized_archive_id" "uuid"
);


--
-- Name: smn_ai_brief_response; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_ai_brief_response" (
    "id" "uuid" NOT NULL,
    "archive_id" "uuid" NOT NULL,
    "team_id" "text" NOT NULL,
    "author_id" "text" NOT NULL,
    "response_text" "text" NOT NULL,
    "provider" "text",
    "model" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "human_edited" boolean DEFAULT false NOT NULL,
    CONSTRAINT "smn_ai_brief_response_response_text_check" CHECK (("length"("btrim"("response_text")) > 0))
);


--
-- Name: smn_ai_brief_template; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_ai_brief_template" (
    "id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "sections" "jsonb" NOT NULL,
    "questions" "jsonb" NOT NULL,
    "instructions" "jsonb" NOT NULL,
    "data" "jsonb" NOT NULL,
    "depth" integer NOT NULL,
    "revision" integer DEFAULT 1 NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_ai_brief_template_depth_check" CHECK ((("depth" >= 1) AND ("depth" <= 5)))
);


--
-- Name: smn_auth_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_auth_audit" (
    "id" "text" NOT NULL,
    "account_id" "text" NOT NULL,
    "action" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_auth_audit_action_check" CHECK (("action" = ANY (ARRAY['password_changed'::"text", 'recovery_prepared'::"text", 'recovery_used'::"text"])))
);


--
-- Name: smn_automatic_highlight; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_automatic_highlight" (
    "id" "text" NOT NULL,
    "category" "text" NOT NULL,
    "source_kind" "text" NOT NULL,
    "source_id" "text" NOT NULL,
    "source_revision" integer NOT NULL,
    "title" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "actor_id" "text",
    "invalidated_at" timestamp with time zone,
    "invalidated_by" "text",
    "invalidation_reason" "text",
    CONSTRAINT "smn_automatic_highlight_source_revision_check" CHECK (("source_revision" > 0))
);


--
-- Name: smn_automatic_highlight_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_automatic_highlight_settings" (
    "installation_id" "text" NOT NULL,
    "category" "text" NOT NULL,
    "enabled" boolean NOT NULL,
    "revision" integer NOT NULL,
    "updated_by" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_automatic_highlight_settings_category_check" CHECK (("category" = ANY (ARRAY['criticalRisk'::"text", 'atRiskDependency'::"text", 'resolvedObstacle'::"text", 'achievedGoal'::"text", 'recordedDecision'::"text", 'satisfiedDependency'::"text"]))),
    CONSTRAINT "smn_automatic_highlight_settings_revision_check" CHECK (("revision" > 0))
);


--
-- Name: smn_backup_retention; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_backup_retention" (
    "installation_id" "text" NOT NULL,
    "days" integer DEFAULT 30 NOT NULL,
    "revision" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "text",
    CONSTRAINT "smn_backup_retention_days_check" CHECK ((("days" >= 1) AND ("days" <= 3650))),
    CONSTRAINT "smn_backup_retention_revision_check" CHECK (("revision" >= 0))
);


--
-- Name: smn_backup_retention_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_backup_retention_audit" (
    "id" "text" NOT NULL,
    "installation_id" "text" NOT NULL,
    "actor_id" "text",
    "action" "text" NOT NULL,
    "old_days" integer,
    "new_days" integer,
    "package_id" "text",
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_backup_retention_audit_action_check" CHECK (("action" = ANY (ARRAY['policy_changed'::"text", 'package_deleted'::"text"])))
);


--
-- Name: smn_calendar_meeting_outcome_link; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_calendar_meeting_outcome_link" (
    "registry_item_id" "text" NOT NULL,
    "sprint_id" "text" NOT NULL,
    "team_id" "text" NOT NULL,
    "meeting_kind" "text" NOT NULL,
    "meeting_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_calendar_meeting_outcome_link_meeting_kind_check" CHECK (("meeting_kind" = ANY (ARRAY['ceremony'::"text", 'template'::"text", 'exceptional'::"text"])))
);


--
-- Name: smn_calendar_meeting_schedule_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_calendar_meeting_schedule_history" (
    "id" "text" NOT NULL,
    "meeting_kind" "text" NOT NULL,
    "meeting_id" "text" NOT NULL,
    "previous_values" "jsonb" NOT NULL,
    "next_values" "jsonb" NOT NULL,
    "actor_id" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_calendar_meeting_schedule_history_meeting_kind_check" CHECK (("meeting_kind" = ANY (ARRAY['ceremony'::"text", 'template'::"text", 'exceptional'::"text"])))
);


--
-- Name: smn_capacity_actual_override; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_capacity_actual_override" (
    "id" "text" NOT NULL,
    "period_id" "text" NOT NULL,
    "manual_jh" numeric(12,4),
    "revision" integer DEFAULT 1 NOT NULL,
    "updated_by" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_capacity_actual_override_manual_jh_check" CHECK (("manual_jh" >= (0)::numeric)),
    CONSTRAINT "smn_capacity_actual_override_revision_check" CHECK (("revision" >= 1))
);


--
-- Name: smn_capacity_actual_override_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_capacity_actual_override_history" (
    "id" "text" NOT NULL,
    "actual_id" "text" NOT NULL,
    "revision" integer NOT NULL,
    "operation" "text" NOT NULL,
    "before_jh" numeric(12,4),
    "after_jh" numeric(12,4),
    "changed_by" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_actual_audit_operation" CHECK (((("operation" = 'set'::"text") AND ("after_jh" IS NOT NULL)) OR (("operation" = 'clear'::"text") AND ("after_jh" IS NULL)))),
    CONSTRAINT "smn_capacity_actual_override_history_after_jh_check" CHECK (("after_jh" >= (0)::numeric)),
    CONSTRAINT "smn_capacity_actual_override_history_before_jh_check" CHECK (("before_jh" >= (0)::numeric)),
    CONSTRAINT "smn_capacity_actual_override_history_operation_check" CHECK (("operation" = ANY (ARRAY['set'::"text", 'clear'::"text"]))),
    CONSTRAINT "smn_capacity_actual_override_history_revision_check" CHECK (("revision" >= 1))
);


--
-- Name: smn_capacity_actual_snapshot; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_capacity_actual_snapshot" (
    "id" "text" NOT NULL,
    "period_id" "text" NOT NULL,
    "event_id" "text" NOT NULL,
    "retained_jh" numeric(12,4),
    "reference_jh" numeric(12,4),
    "provenance" "text" NOT NULL,
    "closed_at" timestamp with time zone NOT NULL,
    "recorded_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    "closed_by" "text",
    CONSTRAINT "smn_actual_closed_source" CHECK (((("provenance" = 'Non renseigné'::"text") AND ("retained_jh" IS NULL)) OR (("provenance" = ANY (ARRAY['Saisie'::"text", 'Calcul'::"text"])) AND ("retained_jh" IS NOT NULL)))),
    CONSTRAINT "smn_capacity_actual_snapshot_provenance_check" CHECK (("provenance" = ANY (ARRAY['Saisie'::"text", 'Calcul'::"text", 'Non renseigné'::"text"]))),
    CONSTRAINT "smn_capacity_actual_snapshot_reference_jh_check" CHECK (("reference_jh" >= (0)::numeric)),
    CONSTRAINT "smn_capacity_actual_snapshot_retained_jh_check" CHECK (("retained_jh" >= (0)::numeric))
);


--
-- Name: smn_capacity_historical_quality; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_capacity_historical_quality" (
    "id" "text" NOT NULL,
    "team_id" "text" NOT NULL,
    "start_on" "date" NOT NULL,
    "end_on" "date" NOT NULL,
    "quality" "text" NOT NULL,
    "qualified_jh" numeric(12,4),
    "source_kind" "text",
    "source_ref" "text",
    "rationale" "text" NOT NULL,
    "revision" integer DEFAULT 1 NOT NULL,
    "updated_by" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_capacity_historical_quality_qualified_jh_check" CHECK (("qualified_jh" >= (0)::numeric)),
    CONSTRAINT "smn_capacity_historical_quality_quality_check" CHECK (("quality" = ANY (ARRAY['known'::"text", 'estimated'::"text", 'not-supplied'::"text"]))),
    CONSTRAINT "smn_capacity_historical_quality_revision_check" CHECK (("revision" >= 1)),
    CONSTRAINT "smn_capacity_historical_quality_source_kind_check" CHECK (("source_kind" = ANY (ARRAY['document'::"text", 'import'::"text", 'reconstruction'::"text", 'other'::"text"]))),
    CONSTRAINT "smn_historical_quality_period" CHECK (("end_on" >= "start_on")),
    CONSTRAINT "smn_historical_quality_rationale" CHECK ((("length"("btrim"("rationale")) >= 5) AND ("length"("btrim"("rationale")) <= 1000))),
    CONSTRAINT "smn_historical_quality_source" CHECK (((("quality" = 'not-supplied'::"text") AND ("qualified_jh" IS NULL) AND ("source_kind" IS NULL) AND ("source_ref" IS NULL)) OR (("quality" = 'known'::"text") AND ("qualified_jh" IS NOT NULL) AND ("source_kind" = ANY (ARRAY['document'::"text", 'import'::"text", 'other'::"text"])) AND ("source_ref" IS NOT NULL) AND (("length"("btrim"("source_ref")) >= 3) AND ("length"("btrim"("source_ref")) <= 500))) OR (("quality" = 'estimated'::"text") AND ("qualified_jh" IS NOT NULL) AND ("source_kind" IS NOT NULL) AND ("source_ref" IS NOT NULL) AND (("length"("btrim"("source_ref")) >= 3) AND ("length"("btrim"("source_ref")) <= 500)))))
);


--
-- Name: smn_capacity_historical_quality_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_capacity_historical_quality_history" (
    "id" "text" NOT NULL,
    "qualification_id" "text" CONSTRAINT "smn_capacity_historical_quality_histo_qualification_id_not_null" NOT NULL,
    "revision" integer NOT NULL,
    "before_values" "jsonb",
    "after_values" "jsonb" NOT NULL,
    "changed_by" "text",
    "changed_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    CONSTRAINT "smn_capacity_historical_quality_history_revision_check" CHECK (("revision" >= 1))
);


--
-- Name: smn_capacity_initial_snapshot; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_capacity_initial_snapshot" (
    "id" "text" NOT NULL,
    "period_id" "text" NOT NULL,
    "event_id" "text" NOT NULL,
    "initial_jh" numeric(12,4),
    "provenance" "text" NOT NULL,
    "actual_opened_at" timestamp with time zone NOT NULL,
    "recorded_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    "opened_by" "text",
    "manual_revision" integer,
    CONSTRAINT "smn_capacity_initial_snapshot_initial_jh_check" CHECK (("initial_jh" >= (0)::numeric)),
    CONSTRAINT "smn_capacity_initial_snapshot_manual_revision_check" CHECK (("manual_revision" >= 0)),
    CONSTRAINT "smn_capacity_initial_snapshot_provenance_check" CHECK (("provenance" = ANY (ARRAY['Saisie'::"text", 'Calcul'::"text", 'Non renseigné'::"text"]))),
    CONSTRAINT "smn_initial_source_check" CHECK (((("provenance" = 'Non renseigné'::"text") AND ("initial_jh" IS NULL)) OR (("provenance" = ANY (ARRAY['Saisie'::"text", 'Calcul'::"text"])) AND ("initial_jh" IS NOT NULL))))
);


--
-- Name: smn_capacity_period_override; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_capacity_period_override" (
    "id" "text" NOT NULL,
    "team_id" "text" NOT NULL,
    "start_on" "date" NOT NULL,
    "end_on" "date" NOT NULL,
    "manual_jh" numeric(12,4),
    "revision" integer DEFAULT 1 NOT NULL,
    "frozen_at" timestamp with time zone,
    "closed_at" timestamp with time zone,
    "updated_by" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_capacity_period_override_manual_jh_check" CHECK (("manual_jh" >= (0)::numeric)),
    CONSTRAINT "smn_capacity_period_override_order" CHECK (("end_on" >= "start_on")),
    CONSTRAINT "smn_capacity_period_override_revision_check" CHECK (("revision" >= 1))
);


--
-- Name: smn_capacity_period_override_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_capacity_period_override_history" (
    "id" "text" NOT NULL,
    "period_id" "text" NOT NULL,
    "revision" integer NOT NULL,
    "operation" "text" NOT NULL,
    "before_jh" numeric(12,4),
    "after_jh" numeric(12,4),
    "changed_by" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_capacity_period_history_set" CHECK (((("operation" = 'set'::"text") AND ("after_jh" IS NOT NULL)) OR (("operation" = 'clear'::"text") AND ("after_jh" IS NULL)))),
    CONSTRAINT "smn_capacity_period_override_history_after_jh_check" CHECK (("after_jh" >= (0)::numeric)),
    CONSTRAINT "smn_capacity_period_override_history_before_jh_check" CHECK (("before_jh" >= (0)::numeric)),
    CONSTRAINT "smn_capacity_period_override_history_operation_check" CHECK (("operation" = ANY (ARRAY['set'::"text", 'clear'::"text"]))),
    CONSTRAINT "smn_capacity_period_override_history_revision_check" CHECK (("revision" >= 1))
);


--
-- Name: smn_capacity_replanning; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_capacity_replanning" (
    "id" "text" NOT NULL,
    "period_id" "text" NOT NULL,
    "target_start_on" "date" NOT NULL,
    "target_end_on" "date" NOT NULL,
    "revision" integer DEFAULT 1 NOT NULL,
    "confirmed_by" "text",
    "confirmed_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    CONSTRAINT "smn_capacity_replanning_revision_check" CHECK (("revision" >= 1)),
    CONSTRAINT "smn_replanning_dates" CHECK (("target_end_on" >= "target_start_on"))
);


--
-- Name: smn_capacity_replanning_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_capacity_replanning_history" (
    "id" "text" NOT NULL,
    "replanning_id" "text" NOT NULL,
    "revision" integer NOT NULL,
    "event_id" "text" NOT NULL,
    "previous_values" "jsonb",
    "confirmed_values" "jsonb" NOT NULL,
    "preview_digest" "text" NOT NULL,
    "confirmed_by" "text",
    "confirmed_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    CONSTRAINT "smn_capacity_replanning_history_preview_digest_check" CHECK (("length"("preview_digest") = 64)),
    CONSTRAINT "smn_capacity_replanning_history_revision_check" CHECK (("revision" >= 1))
);


--
-- Name: smn_capacity_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_capacity_settings" (
    "installation_id" "text" NOT NULL,
    "hours_per_jh" numeric(4,2) DEFAULT 8 NOT NULL,
    "revision" integer DEFAULT 1 NOT NULL,
    "updated_by" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_capacity_settings_hours_per_jh_check" CHECK ((("hours_per_jh" >= (1)::numeric) AND ("hours_per_jh" <= (24)::numeric))),
    CONSTRAINT "smn_capacity_settings_revision_check" CHECK (("revision" >= 1))
);


--
-- Name: smn_capacity_settings_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_capacity_settings_audit" (
    "id" "text" NOT NULL,
    "installation_id" "text" NOT NULL,
    "revision" integer NOT NULL,
    "previous_hours" numeric(4,2) NOT NULL,
    "new_hours" numeric(4,2) NOT NULL,
    "changed_by" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_capacity_settings_audit_revision_check" CHECK (("revision" >= 2))
);


--
-- Name: smn_company; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_company" (
    "id" "text" NOT NULL,
    "installation_id" "text" NOT NULL,
    "name" character varying(120) NOT NULL,
    "comment" "text",
    "color" "text" NOT NULL,
    "archived_at" timestamp with time zone,
    "revision" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "text",
    "updated_by" "text",
    CONSTRAINT "smn_company_color_check" CHECK (("color" = ANY (ARRAY['blue'::"text", 'indigo'::"text", 'violet'::"text", 'teal'::"text", 'green'::"text", 'amber'::"text", 'orange'::"text", 'red'::"text"]))),
    CONSTRAINT "smn_company_name_nonempty" CHECK (("length"("btrim"(("name")::"text")) > 0)),
    CONSTRAINT "smn_company_revision_check" CHECK (("revision" >= 1))
);


--
-- Name: smn_company_capacity_recalc; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_company_capacity_recalc" (
    "id" "text" NOT NULL,
    "company_id" "text" NOT NULL,
    "closure_id" "text" NOT NULL,
    "closure_revision" integer NOT NULL,
    "start_on" "date" NOT NULL,
    "end_on" "date" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "attempts" integer DEFAULT 0 NOT NULL,
    "last_error" "text",
    "result" "jsonb",
    "next_attempt_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_company_capacity_recalc_attempts_check" CHECK (("attempts" >= 0)),
    CONSTRAINT "smn_company_capacity_recalc_check" CHECK (("start_on" <= "end_on")),
    CONSTRAINT "smn_company_capacity_recalc_closure_revision_check" CHECK (("closure_revision" > 0)),
    CONSTRAINT "smn_company_capacity_recalc_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'running'::"text", 'done'::"text", 'failed'::"text"])))
);


--
-- Name: smn_company_closure; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_company_closure" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "start_on" "date" NOT NULL,
    "end_on" "date" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "revision" integer DEFAULT 1 NOT NULL,
    "created_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "company_id" "text" NOT NULL,
    CONSTRAINT "smn_company_closure_date_order" CHECK (("start_on" <= "end_on")),
    CONSTRAINT "smn_company_closure_name_check" CHECK ((("char_length"("btrim"("name")) >= 1) AND ("char_length"("btrim"("name")) <= 120))),
    CONSTRAINT "smn_company_closure_revision_check" CHECK (("revision" >= 1))
);


--
-- Name: smn_company_closure_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_company_closure_history" (
    "id" "text" NOT NULL,
    "closure_id" "text" NOT NULL,
    "revision" integer NOT NULL,
    "operation" "text" NOT NULL,
    "previous_values" "jsonb",
    "next_values" "jsonb" NOT NULL,
    "changed_by" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_company_closure_history_next_values_check" CHECK (("jsonb_typeof"("next_values") = 'object'::"text")),
    CONSTRAINT "smn_company_closure_history_operation_check" CHECK (("operation" = ANY (ARRAY['create'::"text", 'update'::"text"]))),
    CONSTRAINT "smn_company_closure_history_revision_check" CHECK (("revision" >= 1))
);


--
-- Name: smn_configuration_task; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_configuration_task" (
    "installation_id" "text" NOT NULL,
    "task_key" "text" NOT NULL,
    "status" "text" DEFAULT 'todo'::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "text",
    CONSTRAINT "smn_configuration_task_status_check" CHECK (("status" = ANY (ARRAY['todo'::"text", 'done'::"text", 'ignored'::"text"]))),
    CONSTRAINT "smn_configuration_task_task_key_check" CHECK (("task_key" = ANY (ARRAY['reference-country'::"text", 'recovery-phrase'::"text", 'display-preferences'::"text"])))
);


--
-- Name: smn_country; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_country" (
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "origin" "text" NOT NULL,
    "created_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "revision" integer DEFAULT 0 NOT NULL,
    "archived_at" timestamp with time zone,
    CONSTRAINT "smn_country_code_check" CHECK (("code" ~ '^[A-Z]{2}$'::"text")),
    CONSTRAINT "smn_country_name_check" CHECK ((("char_length"("name") >= 1) AND ("char_length"("name") <= 120))),
    CONSTRAINT "smn_country_origin_check" CHECK (("origin" = ANY (ARRAY['initial'::"text", 'manual'::"text"])))
);


--
-- Name: smn_country_lifecycle_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_country_lifecycle_audit" (
    "id" "text" NOT NULL,
    "country_code" "text" NOT NULL,
    "action" "text" NOT NULL,
    "old_archived_at" timestamp with time zone,
    "new_archived_at" timestamp with time zone,
    "old_revision" integer NOT NULL,
    "new_revision" integer NOT NULL,
    "actor_id" "text",
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_country_lifecycle_audit_action_check" CHECK (("action" = ANY (ARRAY['archive'::"text", 'reactivate'::"text"]))),
    CONSTRAINT "smn_country_lifecycle_audit_check" CHECK (("new_revision" = ("old_revision" + 1)))
);


--
-- Name: smn_country_name_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_country_name_audit" (
    "id" "text" NOT NULL,
    "country_code" "text" NOT NULL,
    "revision" integer NOT NULL,
    "previous_name" "text" NOT NULL,
    "new_name" "text" NOT NULL,
    "actor_id" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_country_name_audit_revision_check" CHECK (("revision" > 0))
);


--
-- Name: smn_dashboard_event_edit_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_dashboard_event_edit_audit" (
    "id" "text" NOT NULL,
    "event_kind" "text" NOT NULL,
    "event_id" "text" NOT NULL,
    "before_values" "jsonb" NOT NULL,
    "after_values" "jsonb" NOT NULL,
    "actor_id" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_dashboard_note; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_dashboard_note" (
    "id" "text" NOT NULL,
    "sprint_id" "text" NOT NULL,
    "team_id" "text" NOT NULL,
    "body" "text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "created_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_dashboard_note_body_check" CHECK ((("length"("btrim"("body")) >= 1) AND ("length"("btrim"("body")) <= 2000))),
    CONSTRAINT "smn_dashboard_note_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'done'::"text"])))
);


--
-- Name: smn_dashboard_note_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_dashboard_note_audit" (
    "id" "text" NOT NULL,
    "note_id" "text" NOT NULL,
    "action" "text" NOT NULL,
    "actor_id" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "details" "jsonb" NOT NULL,
    CONSTRAINT "smn_dashboard_note_audit_action_check" CHECK (("action" = ANY (ARRAY['created'::"text", 'done'::"text"])))
);


--
-- Name: smn_dashboard_note_edit_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_dashboard_note_edit_audit" (
    "id" "text" NOT NULL,
    "note_id" "text" NOT NULL,
    "before_values" "jsonb" NOT NULL,
    "after_values" "jsonb" NOT NULL,
    "actor_id" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_decision_detail; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_decision_detail" (
    "item_id" "text" NOT NULL,
    "rationale" "text",
    "replaces_id" "text",
    "revision" integer DEFAULT 1 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "text",
    CONSTRAINT "smn_decision_detail_revision_check" CHECK (("revision" > 0))
);


--
-- Name: smn_decision_detail_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_decision_detail_audit" (
    "id" "text" NOT NULL,
    "item_id" "text" NOT NULL,
    "revision" integer NOT NULL,
    "before_values" "jsonb",
    "after_values" "jsonb" NOT NULL,
    "actor_id" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_dependency_parties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_dependency_parties" (
    "item_id" "text" NOT NULL,
    "requester" "jsonb" NOT NULL,
    "contributor" "jsonb" NOT NULL,
    "revision" integer NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "text",
    CONSTRAINT "smn_dependency_parties_revision_check" CHECK (("revision" > 0))
);


--
-- Name: smn_dependency_parties_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_dependency_parties_audit" (
    "id" "text" NOT NULL,
    "item_id" "text" NOT NULL,
    "revision" integer NOT NULL,
    "before_values" "jsonb",
    "after_values" "jsonb" NOT NULL,
    "actor_id" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_dependency_vigilance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_dependency_vigilance" (
    "item_id" "text" NOT NULL,
    "at_risk" boolean DEFAULT false NOT NULL,
    "revision" integer DEFAULT 1 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "text"
);


--
-- Name: smn_dependency_vigilance_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_dependency_vigilance_audit" (
    "id" "text" NOT NULL,
    "item_id" "text" NOT NULL,
    "revision" integer NOT NULL,
    "before_values" "jsonb",
    "after_values" "jsonb" NOT NULL,
    "actor_id" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_exceptional_capacity_impact_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_exceptional_capacity_impact_history" (
    "id" "text" NOT NULL,
    "meeting_id" "text" NOT NULL,
    "previous_value" boolean NOT NULL,
    "new_value" boolean NOT NULL,
    "actor_id" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_exceptional_meeting_participant; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_exceptional_meeting_participant" (
    "meeting_id" "text" NOT NULL,
    "member_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_exceptional_meeting_participant_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_exceptional_meeting_participant_audit" (
    "id" "text" NOT NULL,
    "meeting_id" "text" NOT NULL,
    "before_member_ids" "jsonb" CONSTRAINT "smn_exceptional_meeting_participant__before_member_ids_not_null" NOT NULL,
    "after_member_ids" "jsonb" CONSTRAINT "smn_exceptional_meeting_participant_a_after_member_ids_not_null" NOT NULL,
    "actor_id" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_fact_selection; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_fact_selection" (
    "origin" "text" NOT NULL,
    "fact_id" "text" NOT NULL,
    "hidden" boolean DEFAULT false NOT NULL,
    "promoted" boolean DEFAULT false NOT NULL,
    "selected" boolean DEFAULT true NOT NULL,
    "revision" integer DEFAULT 1 NOT NULL,
    "updated_by" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_fact_selection_origin_check" CHECK (("origin" = ANY (ARRAY['manual'::"text", 'automatic'::"text"])))
);


--
-- Name: smn_fact_selection_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_fact_selection_audit" (
    "id" "text" NOT NULL,
    "origin" "text" NOT NULL,
    "fact_id" "text" NOT NULL,
    "previous_values" "jsonb",
    "next_values" "jsonb" NOT NULL,
    "actor_id" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_general_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_general_settings" (
    "installation_id" "text" NOT NULL,
    "locale" "text" DEFAULT 'fr'::"text" NOT NULL,
    "theme" "text" DEFAULT 'light'::"text" NOT NULL,
    "reference_country" "text",
    "revision" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "text",
    "palette" "text" DEFAULT 'ocean'::"text" NOT NULL,
    CONSTRAINT "smn_general_settings_locale_check" CHECK (("locale" = ANY (ARRAY['fr'::"text", 'en'::"text"]))),
    CONSTRAINT "smn_general_settings_palette_check" CHECK (("palette" = ANY (ARRAY['ocean'::"text", 'forest'::"text", 'violet'::"text"]))),
    CONSTRAINT "smn_general_settings_reference_country_check" CHECK ((("reference_country" IS NULL) OR ("reference_country" ~ '^[A-Z]{2}$'::"text"))),
    CONSTRAINT "smn_general_settings_revision_check" CHECK (("revision" >= 0)),
    CONSTRAINT "smn_general_settings_theme_check" CHECK (("theme" = ANY (ARRAY['light'::"text", 'dark'::"text"])))
);


--
-- Name: smn_general_settings_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_general_settings_audit" (
    "id" "text" NOT NULL,
    "installation_id" "text" NOT NULL,
    "actor_id" "text",
    "old_values" "jsonb" NOT NULL,
    "new_values" "jsonb" NOT NULL,
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_historical_csv_attempt; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_historical_csv_attempt" (
    "id" "text" NOT NULL,
    "actor_id" "text",
    "created_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    "status" "text" NOT NULL,
    "mode" "text" NOT NULL,
    "scope" "text" NOT NULL,
    "batch_id" "text",
    "read_count" integer NOT NULL,
    "recognized_count" integer NOT NULL,
    "applied_count" integer NOT NULL,
    "preserved_count" integer NOT NULL,
    "rejected_count" integer NOT NULL,
    "cycle_ids" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "errors" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    CONSTRAINT "smn_historical_csv_attempt_status_check" CHECK (("status" = ANY (ARRAY['preview-valid'::"text", 'preview-refused'::"text", 'preview-cancelled'::"text", 'import-confirmed'::"text", 'import-refused'::"text"])))
);


--
-- Name: smn_historical_csv_batch; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_historical_csv_batch" (
    "id" "text" NOT NULL,
    "mode" "text" NOT NULL,
    "actor_id" "text",
    "created_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL
);


--
-- Name: smn_historical_csv_change; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_historical_csv_change" (
    "id" "text" NOT NULL,
    "batch_id" "text" NOT NULL,
    "cycle_id" "text" NOT NULL,
    "metric_code" "text" NOT NULL,
    "previous_value" numeric(14,4),
    "next_value" numeric(14,4) NOT NULL,
    "quality" "text" NOT NULL,
    "action" "text" NOT NULL,
    "actor_id" "text",
    "changed_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    "source_line" integer,
    "previous_quality" "text",
    CONSTRAINT "smn_historical_csv_change_quality_check" CHECK (("quality" = ANY (ARRAY['known'::"text", 'estimated'::"text"])))
);


--
-- Name: smn_human_analysis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_human_analysis" (
    "id" "uuid" NOT NULL,
    "team_id" "text" NOT NULL,
    "cycle_id" "text" NOT NULL,
    "mode" "text" NOT NULL,
    "archive_id" "uuid",
    "scope" "text" NOT NULL,
    "content" "text" NOT NULL,
    "origin" "text" DEFAULT 'human'::"text" NOT NULL,
    "author_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_human_analysis_mode_check" CHECK (("mode" = ANY (ARRAY['scrum'::"text", 'kanban'::"text"]))),
    CONSTRAINT "smn_human_analysis_origin_check" CHECK (("origin" = 'human'::"text"))
);


--
-- Name: smn_installation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_installation" (
    "id" "text" NOT NULL,
    "state" "text" NOT NULL,
    "schema_version" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_kanban_batch_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_kanban_batch_audit" (
    "id" "text" NOT NULL,
    "team_id" "text" NOT NULL,
    "actor_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "cadence" "text" NOT NULL,
    "quantity" integer NOT NULL,
    "cadence_revision" integer NOT NULL,
    "periods" "jsonb" NOT NULL,
    CONSTRAINT "smn_kanban_batch_audit_quantity_check" CHECK ((("quantity" >= 2) AND ("quantity" <= 6)))
);


--
-- Name: smn_kanban_cadence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_kanban_cadence" (
    "team_id" "text" NOT NULL,
    "frequency" "text" DEFAULT 'monthly'::"text" NOT NULL,
    "start_day" integer DEFAULT 1 NOT NULL,
    "time_zone" "text" DEFAULT 'Europe/Paris'::"text" NOT NULL,
    "revision" integer DEFAULT 1 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "text",
    CONSTRAINT "smn_kanban_cadence_frequency_check" CHECK (("frequency" = ANY (ARRAY['monthly'::"text", 'weekly'::"text", 'biweekly'::"text"]))),
    CONSTRAINT "smn_kanban_cadence_revision_check" CHECK (("revision" >= 1)),
    CONSTRAINT "smn_kanban_cadence_start_day_check" CHECK ((("start_day" >= 1) AND ("start_day" <= 7)))
);


--
-- Name: smn_kanban_cadence_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_kanban_cadence_audit" (
    "id" "text" NOT NULL,
    "team_id" "text" NOT NULL,
    "revision" integer NOT NULL,
    "before_values" "jsonb" NOT NULL,
    "after_values" "jsonb" NOT NULL,
    "changed_by" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_kanban_capacity_opening; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_kanban_capacity_opening" (
    "period_id" "text" NOT NULL,
    "opened_on" "date" NOT NULL,
    "captured_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "provenance" "text" NOT NULL,
    "initial_jh" numeric(12,4),
    CONSTRAINT "smn_kanban_capacity_opening_check" CHECK ((("provenance" <> 'historical-unavailable'::"text") OR ("initial_jh" IS NULL))),
    CONSTRAINT "smn_kanban_capacity_opening_provenance_v2_check" CHECK (("provenance" = ANY (ARRAY['pending-capture'::"text", 'historical-unavailable'::"text", 'calculated'::"text", 'manual'::"text", 'unavailable-at-opening'::"text"])))
);


--
-- Name: smn_kanban_closure; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_kanban_closure" (
    "id" "text" NOT NULL,
    "period_id" "text" NOT NULL,
    "version" integer NOT NULL,
    "snapshot" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "text",
    CONSTRAINT "smn_kanban_closure_version_check" CHECK (("version" > 0))
);


--
-- Name: smn_kanban_flow_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_kanban_flow_audit" (
    "id" "text" NOT NULL,
    "period_id" "text" NOT NULL,
    "previous_values" "jsonb",
    "next_values" "jsonb" NOT NULL,
    "actor_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_kanban_flow_counts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_kanban_flow_counts" (
    "period_id" "text" NOT NULL,
    "started" bigint,
    "throughput" bigint,
    "wip_final" bigint,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "text",
    CONSTRAINT "smn_kanban_flow_counts_started_check" CHECK (("started" >= 0)),
    CONSTRAINT "smn_kanban_flow_counts_throughput_check" CHECK (("throughput" >= 0)),
    CONSTRAINT "smn_kanban_flow_counts_wip_final_check" CHECK (("wip_final" >= 0))
);


--
-- Name: smn_kanban_goal; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_kanban_goal" (
    "id" "text" NOT NULL,
    "period_id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "evaluation" "text" DEFAULT 'not_evaluated'::"text" NOT NULL,
    "comment" "text",
    "revision" integer DEFAULT 1 NOT NULL,
    "created_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_kanban_goal_evaluation_check" CHECK (("evaluation" = ANY (ARRAY['not_evaluated'::"text", 'achieved'::"text", 'partially_achieved'::"text", 'not_achieved'::"text"]))),
    CONSTRAINT "smn_kanban_goal_title_check" CHECK ((("length"("btrim"("title")) >= 1) AND ("length"("btrim"("title")) <= 240)))
);


--
-- Name: smn_kanban_goal_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_kanban_goal_audit" (
    "id" "text" NOT NULL,
    "goal_id" "text" NOT NULL,
    "before_values" "jsonb",
    "after_values" "jsonb" NOT NULL,
    "actor_id" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_kanban_meeting; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_kanban_meeting" (
    "id" "text" NOT NULL,
    "period_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "starts_at" timestamp with time zone NOT NULL,
    "ends_at" timestamp with time zone NOT NULL,
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "provenance" "text" DEFAULT 'manual'::"text" NOT NULL,
    "created_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_kanban_meeting_check" CHECK (("ends_at" > "starts_at")),
    CONSTRAINT "smn_kanban_meeting_provenance_check" CHECK (("provenance" = ANY (ARRAY['manual'::"text", 'exceptional'::"text"]))),
    CONSTRAINT "smn_kanban_meeting_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'held'::"text", 'not_held'::"text", 'cancelled'::"text"])))
);


--
-- Name: smn_kanban_period; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_kanban_period" (
    "id" "text" NOT NULL,
    "team_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "start_on" "date" NOT NULL,
    "end_on" "date" NOT NULL,
    "status" "text" DEFAULT 'planned'::"text" NOT NULL,
    "time_zone" "text" NOT NULL,
    "created_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "deleted_by" "text",
    CONSTRAINT "smn_kanban_period_check" CHECK (("end_on" >= "start_on"))
);


--
-- Name: smn_kanban_period_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_kanban_period_audit" (
    "id" "text" NOT NULL,
    "period_id" "text" NOT NULL,
    "action" "text" NOT NULL,
    "details" "jsonb" NOT NULL,
    "actor_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_kanban_period_transition; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_kanban_period_transition" (
    "id" "text" NOT NULL,
    "period_id" "text" NOT NULL,
    "transition" "text" NOT NULL,
    "business_on" "date" NOT NULL,
    "processed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "provenance" "text" NOT NULL,
    CONSTRAINT "smn_kanban_period_transition_provenance_check" CHECK (("provenance" = ANY (ARRAY['on-time'::"text", 'recovered'::"text"]))),
    CONSTRAINT "smn_kanban_period_transition_transition_check" CHECK (("transition" = ANY (ARRAY['started'::"text", 'ended'::"text"])))
);


--
-- Name: smn_kanban_registry_link; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_kanban_registry_link" (
    "period_id" "text" NOT NULL,
    "item_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_kanban_registry_link_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_kanban_registry_link_audit" (
    "id" "text" NOT NULL,
    "period_id" "text" NOT NULL,
    "item_id" "text" NOT NULL,
    "action" "text" NOT NULL,
    "actor_id" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_kanban_registry_link_audit_action_check" CHECK (("action" = ANY (ARRAY['linked'::"text", 'unlinked'::"text"])))
);


--
-- Name: smn_kanban_render_reference; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_kanban_render_reference" (
    "id" "text" NOT NULL,
    "period_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "text" NOT NULL,
    "sha256" "text" NOT NULL,
    "payload" "jsonb" NOT NULL
);


--
-- Name: smn_kanban_report_analysis_choice; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_kanban_report_analysis_choice" (
    "period_id" "text" NOT NULL,
    "selected_ids" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_kanban_timing; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_kanban_timing" (
    "period_id" "text" NOT NULL,
    "cycle_days" numeric(14,6),
    "cycle_convention" "text" DEFAULT 'unknown'::"text" NOT NULL,
    "cycle_source" "text" DEFAULT ''::"text" NOT NULL,
    "lead_days" numeric(14,6),
    "lead_convention" "text" DEFAULT 'unknown'::"text" NOT NULL,
    "lead_source" "text" DEFAULT ''::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "text"
);


--
-- Name: smn_kanban_timing_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_kanban_timing_audit" (
    "id" "text" NOT NULL,
    "period_id" "text" NOT NULL,
    "before_values" "jsonb",
    "after_values" "jsonb" NOT NULL,
    "actor_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_link; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_link" (
    "id" "text" NOT NULL,
    "installation_id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "url" "text" NOT NULL,
    "description" "text",
    "category_id" "text" CONSTRAINT "smn_link_category_id_not_null1" NOT NULL,
    "scope" "text" NOT NULL,
    "team_id" "text",
    "created_by" "text",
    "updated_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "revision" integer DEFAULT 1 NOT NULL,
    CONSTRAINT "smn_link_revision_check" CHECK (("revision" > 0)),
    CONSTRAINT "smn_link_scope_check" CHECK (("scope" = ANY (ARRAY['TRANSVERSE'::"text", 'EQUIPE'::"text"]))),
    CONSTRAINT "smn_link_scope_team_check" CHECK (((("scope" = 'TRANSVERSE'::"text") AND ("team_id" IS NULL)) OR (("scope" = 'EQUIPE'::"text") AND ("team_id" IS NOT NULL)))),
    CONSTRAINT "smn_link_title_check" CHECK ((("length"("btrim"("title")) >= 1) AND ("length"("btrim"("title")) <= 200))),
    CONSTRAINT "smn_link_url_check" CHECK (("url" ~* '^https?://[^[:space:]]+$'::"text"))
);


--
-- Name: smn_link_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_link_audit" (
    "id" "text" NOT NULL,
    "link_id" "text" NOT NULL,
    "installation_id" "text" NOT NULL,
    "operation" "text" NOT NULL,
    "before_values" "jsonb",
    "after_values" "jsonb",
    "actor_id" "text",
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_link_audit_operation_check" CHECK (("operation" = ANY (ARRAY['CREATE'::"text", 'UPDATE'::"text", 'DELETE'::"text"])))
);


--
-- Name: smn_link_category; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_link_category" (
    "id" "text" NOT NULL,
    "installation_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_link_category_name_check" CHECK ((("length"("btrim"("name")) >= 1) AND ("length"("btrim"("name")) <= 100)))
);


--
-- Name: smn_meeting_actual_duration_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_meeting_actual_duration_audit" (
    "id" "text" NOT NULL,
    "kind" "text" NOT NULL,
    "event_id" "text" NOT NULL,
    "previous_minutes" integer,
    "new_minutes" integer NOT NULL,
    "planned_minutes" integer NOT NULL,
    "actor_id" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_meeting_actual_duration_audit_kind_check" CHECK (("kind" = ANY (ARRAY['standard'::"text", 'custom'::"text", 'exceptional'::"text"])))
);


--
-- Name: smn_member; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_member" (
    "id" "text" NOT NULL,
    "installation_id" "text" NOT NULL,
    "batch_id" "text" CONSTRAINT "smn_member_batch_id_not_null1" NOT NULL,
    "member_number" integer NOT NULL,
    "display_name" "text" NOT NULL,
    "is_provisional" boolean DEFAULT true NOT NULL,
    "contract_percent" integer DEFAULT 100 NOT NULL,
    "contribution_percent" integer DEFAULT 100 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "email" "text",
    "revision" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "archived_at" timestamp with time zone,
    "archived_by" "text",
    "professional_function" "text",
    "company_id" "text",
    CONSTRAINT "smn_member_contract_percent_check" CHECK ((("contract_percent" >= 0) AND ("contract_percent" <= 100))),
    CONSTRAINT "smn_member_contribution_percent_check" CHECK ((("contribution_percent" >= 0) AND ("contribution_percent" <= 100))),
    CONSTRAINT "smn_member_display_name_check" CHECK ((("char_length"("display_name") >= 1) AND ("char_length"("display_name") <= 120))),
    CONSTRAINT "smn_member_email_length" CHECK ((("email" IS NULL) OR (("char_length"("email") <= 254) AND (POSITION(('@'::"text") IN ("email")) > 1)))),
    CONSTRAINT "smn_member_member_number_check" CHECK (("member_number" > 0)),
    CONSTRAINT "smn_member_professional_function_valid" CHECK ((("professional_function" IS NULL) OR ("char_length"("professional_function") <= 120))),
    CONSTRAINT "smn_member_revision_check" CHECK (("revision" >= 0))
);


--
-- Name: smn_member_absence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_member_absence" (
    "id" "text" NOT NULL,
    "member_id" "text" NOT NULL,
    "category_id" "text" NOT NULL,
    "start_on" "date" NOT NULL,
    "end_on" "date" NOT NULL,
    "start_slot" "text" NOT NULL,
    "end_slot" "text" NOT NULL,
    "is_planned" boolean NOT NULL,
    "reason" "text" NOT NULL,
    "revision" integer DEFAULT 1 NOT NULL,
    "created_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_absence_valid_interval" CHECK ((("start_on" <= "end_on") AND (("start_on" <> "end_on") OR ("start_slot" = 'morning'::"text") OR ("end_slot" = 'afternoon'::"text")))),
    CONSTRAINT "smn_member_absence_end_slot_check" CHECK (("end_slot" = ANY (ARRAY['morning'::"text", 'afternoon'::"text"]))),
    CONSTRAINT "smn_member_absence_reason_check" CHECK ((("char_length"("btrim"("reason")) >= 1) AND ("char_length"("btrim"("reason")) <= 200))),
    CONSTRAINT "smn_member_absence_revision_check" CHECK (("revision" >= 1)),
    CONSTRAINT "smn_member_absence_start_slot_check" CHECK (("start_slot" = ANY (ARRAY['morning'::"text", 'afternoon'::"text"])))
);


--
-- Name: smn_member_absence_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_member_absence_history" (
    "id" "text" NOT NULL,
    "absence_id" "text" NOT NULL,
    "revision" integer NOT NULL,
    "operation" "text" NOT NULL,
    "before_values" "jsonb",
    "after_values" "jsonb" NOT NULL,
    "changed_by" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_member_absence_history_after_values_check" CHECK (("jsonb_typeof"("after_values") = 'object'::"text")),
    CONSTRAINT "smn_member_absence_history_operation_check" CHECK (("operation" = ANY (ARRAY['create'::"text", 'update'::"text"]))),
    CONSTRAINT "smn_member_absence_history_revision_check" CHECK (("revision" >= 1))
);


--
-- Name: smn_member_assignment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_member_assignment" (
    "id" "text" NOT NULL,
    "member_id" "text" NOT NULL,
    "team_id" "text" NOT NULL,
    "start_on" "date" DEFAULT CURRENT_DATE NOT NULL,
    "end_on" "date",
    "agile_role" "text" NOT NULL,
    "allocation_percent" integer DEFAULT 100 NOT NULL,
    "role_percent" integer DEFAULT 100 NOT NULL,
    CONSTRAINT "smn_member_assignment_agile_role_check" CHECK (("agile_role" = ANY (ARRAY['scrum_master'::"text", 'product_owner'::"text", 'developer'::"text"]))),
    CONSTRAINT "smn_member_assignment_allocation_percent_check" CHECK ((("allocation_percent" >= 0) AND ("allocation_percent" <= 100))),
    CONSTRAINT "smn_member_assignment_check" CHECK ((("end_on" IS NULL) OR ("end_on" >= "start_on"))),
    CONSTRAINT "smn_member_assignment_role_percent_check" CHECK ((("role_percent" >= 0) AND ("role_percent" <= 100)))
);


--
-- Name: smn_member_assignment_start_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_member_assignment_start_audit" (
    "id" "uuid" NOT NULL,
    "member_id" "uuid" NOT NULL,
    "assignment_id" "uuid" NOT NULL,
    "old_start_on" "date" NOT NULL,
    "new_start_on" "date" NOT NULL,
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "changed_by" "text" NOT NULL
);


--
-- Name: smn_member_assignment_version; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_member_assignment_version" (
    "id" "text" NOT NULL,
    "assignment_id" "text" NOT NULL,
    "revision" integer NOT NULL,
    "effective_from" "date" NOT NULL,
    "allocation_percent" integer NOT NULL,
    "contract_percent" integer NOT NULL,
    "contribution_percent" integer NOT NULL,
    "scrum_master_percent" integer NOT NULL,
    "product_owner_percent" integer NOT NULL,
    "developer_percent" integer NOT NULL,
    "created_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_member_assignment_version_allocation_percent_check" CHECK ((("allocation_percent" >= 0) AND ("allocation_percent" <= 100))),
    CONSTRAINT "smn_member_assignment_version_check" CHECK (("allocation_percent" <= "contract_percent")),
    CONSTRAINT "smn_member_assignment_version_check1" CHECK (((("scrum_master_percent" + "product_owner_percent") + "developer_percent") = 100)),
    CONSTRAINT "smn_member_assignment_version_contract_percent_check" CHECK ((("contract_percent" >= 0) AND ("contract_percent" <= 100))),
    CONSTRAINT "smn_member_assignment_version_contribution_percent_check" CHECK ((("contribution_percent" >= 0) AND ("contribution_percent" <= 100))),
    CONSTRAINT "smn_member_assignment_version_developer_percent_check" CHECK ((("developer_percent" >= 0) AND ("developer_percent" <= 100))),
    CONSTRAINT "smn_member_assignment_version_product_owner_percent_check" CHECK ((("product_owner_percent" >= 0) AND ("product_owner_percent" <= 100))),
    CONSTRAINT "smn_member_assignment_version_revision_check" CHECK (("revision" >= 1)),
    CONSTRAINT "smn_member_assignment_version_scrum_master_percent_check" CHECK ((("scrum_master_percent" >= 0) AND ("scrum_master_percent" <= 100)))
);


--
-- Name: smn_member_batch; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_member_batch" (
    "id" "text" NOT NULL,
    "installation_id" "text" NOT NULL,
    "team_id" "text" NOT NULL,
    "requested_count" integer NOT NULL,
    "created_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_member_batch_requested_count_check" CHECK ((("requested_count" >= 3) AND ("requested_count" <= 50)))
);


--
-- Name: smn_member_calendar_exception; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_member_calendar_exception" (
    "id" "text" NOT NULL,
    "member_id" "text" NOT NULL,
    "on_date" "date" NOT NULL,
    "revision" integer NOT NULL,
    "morning" boolean NOT NULL,
    "afternoon" boolean NOT NULL,
    "note" "text",
    "created_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_member_calendar_exception_note_check" CHECK ((("note" IS NULL) OR ("char_length"("note") <= 200))),
    CONSTRAINT "smn_member_calendar_exception_revision_check" CHECK (("revision" > 0))
);


--
-- Name: smn_member_calendar_week; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_member_calendar_week" (
    "id" "text" NOT NULL,
    "member_id" "text" NOT NULL,
    "revision" integer NOT NULL,
    "effective_from" "date" NOT NULL,
    "days" "jsonb" NOT NULL,
    "created_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_member_calendar_week_days_check" CHECK ((("jsonb_typeof"("days") = 'array'::"text") AND ("jsonb_array_length"("days") = 7))),
    CONSTRAINT "smn_member_calendar_week_revision_check" CHECK (("revision" > 0))
);


--
-- Name: smn_member_identity_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_member_identity_history" (
    "id" "text" NOT NULL,
    "member_id" "text" NOT NULL,
    "previous_values" "jsonb" NOT NULL,
    "next_values" "jsonb" NOT NULL,
    "changed_by" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_member_lifecycle_event; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_member_lifecycle_event" (
    "id" "text" NOT NULL,
    "member_id" "text" NOT NULL,
    "assignment_id" "text",
    "action" "text" NOT NULL,
    "effective_on" "date" NOT NULL,
    "performed_by" "text",
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "details" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "smn_member_lifecycle_event_action_check" CHECK (("action" = ANY (ARRAY['close'::"text", 'archive'::"text", 'reactivate'::"text", 'delete'::"text"])))
);


--
-- Name: smn_member_location; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_member_location" (
    "id" "text" NOT NULL,
    "member_id" "text" NOT NULL,
    "revision" integer NOT NULL,
    "effective_from" "date" NOT NULL,
    "country_iso2" "text",
    "region" "text",
    "city" "text",
    "time_zone" "text",
    "source" "text" NOT NULL,
    "created_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_member_location_city_check" CHECK ((("city" IS NULL) OR ("char_length"("city") <= 120))),
    CONSTRAINT "smn_member_location_country_iso2_check" CHECK ((("country_iso2" IS NULL) OR ("country_iso2" ~ '^[A-Z]{2}$'::"text"))),
    CONSTRAINT "smn_member_location_region_check" CHECK ((("region" IS NULL) OR ("char_length"("region") <= 120))),
    CONSTRAINT "smn_member_location_revision_check" CHECK (("revision" > 0)),
    CONSTRAINT "smn_member_location_source_check" CHECK (("source" = ANY (ARRAY['installation-default'::"text", 'manual'::"text"]))),
    CONSTRAINT "smn_member_location_time_zone_check" CHECK ((("time_zone" IS NULL) OR ("char_length"("time_zone") <= 128)))
);


--
-- Name: smn_national_calendar_coverage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_national_calendar_coverage" (
    "country_code" "text" NOT NULL,
    "calendar_year" integer NOT NULL,
    "status" "text" NOT NULL,
    "entries_count" integer DEFAULT 0 NOT NULL,
    "diagnostic" "text",
    "source_file" "text",
    "checked_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "revision" integer DEFAULT 0 NOT NULL,
    "administrative_validated_at" timestamp with time zone,
    "validated_revision" integer,
    "validated_by" "text",
    "validation_source" "text",
    CONSTRAINT "smn_national_calendar_coverage_calendar_year_check" CHECK ((("calendar_year" >= 1900) AND ("calendar_year" <= 2200))),
    CONSTRAINT "smn_national_calendar_coverage_entries_count_check" CHECK (("entries_count" >= 0)),
    CONSTRAINT "smn_national_calendar_coverage_status_check" CHECK (("status" = ANY (ARRAY['configured'::"text", 'partial'::"text", 'not-configured'::"text", 'invalid'::"text"])))
);


--
-- Name: smn_national_calendar_validation_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_national_calendar_validation_audit" (
    "id" "text" NOT NULL,
    "country_code" "text" NOT NULL,
    "calendar_year" integer NOT NULL,
    "action" "text" NOT NULL,
    "revision" integer NOT NULL,
    "fingerprint" "text",
    "actor_id" "text",
    "source" "text" NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_national_calendar_validation_audit_action_check" CHECK (("action" = ANY (ARRAY['validate'::"text", 'invalidate'::"text"]))),
    CONSTRAINT "smn_national_calendar_validation_audit_calendar_year_check" CHECK ((("calendar_year" >= 1900) AND ("calendar_year" <= 2200))),
    CONSTRAINT "smn_national_calendar_validation_audit_revision_check" CHECK (("revision" >= 0))
);


--
-- Name: smn_national_holiday; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_national_holiday" (
    "country_code" "text" NOT NULL,
    "holiday_date" "date" NOT NULL,
    "name" "text" NOT NULL,
    CONSTRAINT "smn_national_holiday_name_check" CHECK ((("char_length"("btrim"("name")) >= 1) AND ("char_length"("btrim"("name")) <= 120)))
);


--
-- Name: smn_national_holiday_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_national_holiday_audit" (
    "id" "text" NOT NULL,
    "country_code" "text" NOT NULL,
    "holiday_date" "date" NOT NULL,
    "previous_name" "text",
    "new_name" "text" NOT NULL,
    "action" "text" NOT NULL,
    "origin" "text" NOT NULL,
    "actor_id" "text",
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_national_holiday_audit_action_check" CHECK (("action" = ANY (ARRAY['create'::"text", 'replace'::"text"]))),
    CONSTRAINT "smn_national_holiday_audit_new_name_check" CHECK ((("char_length"("btrim"("new_name")) >= 1) AND ("char_length"("btrim"("new_name")) <= 120))),
    CONSTRAINT "smn_national_holiday_audit_origin_check" CHECK (("origin" = ANY (ARRAY['csv'::"text", 'ics'::"text"])))
);


--
-- Name: smn_national_holiday_manual_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_national_holiday_manual_audit" (
    "id" "text" NOT NULL,
    "country_code" "text" NOT NULL,
    "action" "text" NOT NULL,
    "previous_date" "date",
    "new_date" "date",
    "previous_name" "text",
    "new_name" "text",
    "reason" "text" NOT NULL,
    "actor_id" "text",
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_national_holiday_manual_audit_action_check" CHECK (("action" = ANY (ARRAY['create'::"text", 'update'::"text", 'delete'::"text"]))),
    CONSTRAINT "smn_national_holiday_manual_audit_check" CHECK (((("action" = 'create'::"text") AND ("previous_date" IS NULL) AND ("previous_name" IS NULL) AND ("new_date" IS NOT NULL) AND ("new_name" IS NOT NULL)) OR (("action" = 'update'::"text") AND ("previous_date" IS NOT NULL) AND ("previous_name" IS NOT NULL) AND ("new_date" IS NOT NULL) AND ("new_name" IS NOT NULL)) OR (("action" = 'delete'::"text") AND ("previous_date" IS NOT NULL) AND ("previous_name" IS NOT NULL) AND ("new_date" IS NULL) AND ("new_name" IS NULL)))),
    CONSTRAINT "smn_national_holiday_manual_audit_reason_check" CHECK ((("char_length"("btrim"("reason")) >= 1) AND ("char_length"("btrim"("reason")) <= 500)))
);


--
-- Name: smn_product; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_product" (
    "id" "text" NOT NULL,
    "installation_id" "text" NOT NULL,
    "name" "text" NOT NULL
);


--
-- Name: smn_recovery_phrase; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_recovery_phrase" (
    "account_id" "text" NOT NULL,
    "phrase_hash" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_registry_comment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_registry_comment" (
    "id" "text" NOT NULL,
    "item_id" "text" NOT NULL,
    "body" "text" NOT NULL,
    "revision" integer DEFAULT 1 NOT NULL,
    "author_id" "text",
    "author_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "edited_at" timestamp with time zone,
    "editor_id" "text",
    "editor_name" "text",
    "withdrawn_at" timestamp with time zone,
    "withdrawn_by" "text",
    "withdrawn_by_name" "text",
    CONSTRAINT "smn_registry_comment_body_check" CHECK ((("length"("btrim"("body")) >= 1) AND ("length"("btrim"("body")) <= 4000))),
    CONSTRAINT "smn_registry_comment_check" CHECK ((("withdrawn_at" IS NULL) OR ("withdrawn_by_name" IS NOT NULL))),
    CONSTRAINT "smn_registry_comment_revision_check" CHECK (("revision" >= 1))
);


--
-- Name: smn_registry_comment_revision; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_registry_comment_revision" (
    "id" "text" NOT NULL,
    "comment_id" "text" NOT NULL,
    "revision" integer NOT NULL,
    "action" "text" NOT NULL,
    "before_text" "text",
    "after_text" "text",
    "actor_id" "text",
    "actor_name" "text" NOT NULL,
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_registry_comment_revision_action_check" CHECK (("action" = ANY (ARRAY['created'::"text", 'edited'::"text", 'withdrawn'::"text"]))),
    CONSTRAINT "smn_registry_comment_revision_revision_check" CHECK (("revision" >= 1))
);


--
-- Name: smn_registry_cycle_link; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_registry_cycle_link" (
    "item_id" "text" NOT NULL,
    "sprint_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_registry_cycle_link_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_registry_cycle_link_audit" (
    "id" "text" NOT NULL,
    "item_id" "text" NOT NULL,
    "sprint_id" "text" NOT NULL,
    "action" "text" NOT NULL,
    "actor_id" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_registry_cycle_link_audit_action_check" CHECK (("action" = ANY (ARRAY['linked'::"text", 'unlinked'::"text"])))
);


--
-- Name: smn_registry_deadline_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_registry_deadline_settings" (
    "id" "text" NOT NULL,
    "days" integer NOT NULL,
    "revision" integer NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "text",
    CONSTRAINT "smn_registry_deadline_settings_days_check" CHECK ((("days" >= 0) AND ("days" <= 365))),
    CONSTRAINT "smn_registry_deadline_settings_id_check" CHECK (("id" = 'singleton'::"text"))
);


--
-- Name: smn_registry_item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_registry_item" (
    "id" "text" NOT NULL,
    "installation_id" "text" NOT NULL,
    "team_id" "text" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "occurred_on" "date" NOT NULL,
    "status" "text" NOT NULL,
    "description" "text",
    "owner_name" "text",
    "due_on" "date",
    "comment" "text",
    "revision" integer DEFAULT 1 NOT NULL,
    "created_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_registry_item_revision_check" CHECK (("revision" > 0)),
    CONSTRAINT "smn_registry_item_title_check" CHECK ((("length"("btrim"("title")) >= 1) AND ("length"("btrim"("title")) <= 240))),
    CONSTRAINT "smn_registry_item_type_check" CHECK (("type" = ANY (ARRAY['risk'::"text", 'obstacle'::"text", 'dependency'::"text", 'decision'::"text", 'action'::"text", 'highlight'::"text"])))
);


--
-- Name: smn_registry_item_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_registry_item_audit" (
    "id" "text" NOT NULL,
    "item_id" "text" NOT NULL,
    "revision" integer NOT NULL,
    "before_values" "jsonb",
    "after_values" "jsonb" NOT NULL,
    "actor_id" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_registry_item_audit_revision_check" CHECK (("revision" > 0))
);


--
-- Name: smn_registry_linked_request; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_registry_linked_request" (
    "request_id" "text" NOT NULL,
    "source_id" "text" NOT NULL,
    "actor_id" "text" NOT NULL,
    "request_fingerprint" "text" NOT NULL,
    "new_item_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_registry_relation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_registry_relation" (
    "id" "text" NOT NULL,
    "source_id" "text" NOT NULL,
    "target_kind" "text" NOT NULL,
    "target_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_registry_relation_target_kind_check" CHECK (("target_kind" = ANY (ARRAY['record'::"text", 'goal'::"text"])))
);


--
-- Name: smn_registry_relation_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_registry_relation_audit" (
    "id" "text" NOT NULL,
    "source_id" "text" NOT NULL,
    "target_kind" "text" NOT NULL,
    "target_id" "text" NOT NULL,
    "action" "text" NOT NULL,
    "actor_id" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_registry_relation_audit_action_check" CHECK (("action" = ANY (ARRAY['linked'::"text", 'unlinked'::"text"])))
);


--
-- Name: smn_report_analysis_choice; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_report_analysis_choice" (
    "sprint_id" "text" NOT NULL,
    "selected_ids" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_report_archive_grant; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_report_archive_grant" (
    "archive_id" "text" NOT NULL,
    "user_id" "text" NOT NULL,
    "granted_by" "text" NOT NULL,
    "granted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "revoked_at" timestamp with time zone
);


--
-- Name: smn_report_archive_visibility; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_report_archive_visibility" (
    "archive_id" "text" NOT NULL,
    "hidden_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "hidden_by" "text" NOT NULL,
    "reason" "text" NOT NULL
);


--
-- Name: smn_report_content_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_report_content_options" (
    "sprint_id" "text" NOT NULL,
    "options" "jsonb" NOT NULL,
    "revision" integer NOT NULL,
    "updated_by" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_report_content_options_revision_check" CHECK (("revision" > 0))
);


--
-- Name: smn_report_content_options_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_report_content_options_audit" (
    "id" "text" NOT NULL,
    "sprint_id" "text" NOT NULL,
    "revision" integer NOT NULL,
    "options" "jsonb" NOT NULL,
    "actor_id" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_report_document; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_report_document" (
    "id" "text" NOT NULL,
    "sprint_id" "text" NOT NULL,
    "team_id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "language" "text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "template_id" "text" NOT NULL,
    "template_version" integer NOT NULL,
    "content" "jsonb" NOT NULL,
    "revision" integer DEFAULT 1 NOT NULL,
    "created_by" "text",
    "updated_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "creation_request_id" "text",
    CONSTRAINT "smn_report_document_content_check" CHECK (("jsonb_typeof"("content") = 'object'::"text")),
    CONSTRAINT "smn_report_document_language_check" CHECK (("language" = ANY (ARRAY['fr'::"text", 'en'::"text"]))),
    CONSTRAINT "smn_report_document_revision_check" CHECK (("revision" >= 1)),
    CONSTRAINT "smn_report_document_status_check" CHECK (("status" = 'draft'::"text")),
    CONSTRAINT "smn_report_document_template_version_check" CHECK (("template_version" >= 0)),
    CONSTRAINT "smn_report_document_title_check" CHECK ((("length"(TRIM(BOTH FROM "title")) >= 1) AND ("length"(TRIM(BOTH FROM "title")) <= 120)))
);


--
-- Name: smn_report_document_session_write; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_report_document_session_write" (
    "document_id" "text" NOT NULL,
    "session_id" "text" NOT NULL,
    "last_sequence" integer NOT NULL,
    CONSTRAINT "smn_report_document_session_write_last_sequence_check" CHECK (("last_sequence" >= 1))
);


--
-- Name: smn_report_draft; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_report_draft" (
    "sprint_id" "text" NOT NULL,
    "notes" "jsonb" NOT NULL,
    "revision" integer NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "text",
    CONSTRAINT "smn_report_draft_revision_check" CHECK (("revision" > 0))
);


--
-- Name: smn_report_draft_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_report_draft_audit" (
    "id" "text" NOT NULL,
    "sprint_id" "text" NOT NULL,
    "revision" integer NOT NULL,
    "before_values" "jsonb",
    "after_values" "jsonb" NOT NULL,
    "actor_id" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_report_history_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_report_history_options" (
    "sprint_id" "text" NOT NULL,
    "depth" integer NOT NULL,
    "revision" integer NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "text",
    CONSTRAINT "smn_report_history_options_depth_check" CHECK ((("depth" >= 1) AND ("depth" <= 5))),
    CONSTRAINT "smn_report_history_options_revision_check" CHECK (("revision" > 0))
);


--
-- Name: smn_report_language; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_report_language" (
    "sprint_id" "text" NOT NULL,
    "language" "text" NOT NULL,
    "revision" integer NOT NULL,
    "updated_by" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_report_language_language_check" CHECK (("language" = ANY (ARRAY['fr'::"text", 'en'::"text"]))),
    CONSTRAINT "smn_report_language_revision_check" CHECK (("revision" > 0))
);


--
-- Name: smn_report_link_selection; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_report_link_selection" (
    "sprint_id" "text" NOT NULL,
    "link_ids" "jsonb" NOT NULL,
    "revision" integer NOT NULL,
    "updated_by" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_report_link_selection_revision_check" CHECK (("revision" > 0))
);


--
-- Name: smn_report_logo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_report_logo" (
    "sprint_id" "text" NOT NULL,
    "mime" "text" NOT NULL,
    "data" "bytea" NOT NULL,
    "updated_by" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_report_logo_mime_check" CHECK (("mime" = ANY (ARRAY['image/png'::"text", 'image/jpeg'::"text"])))
);


--
-- Name: smn_report_pdf_archive; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_report_pdf_archive" (
    "id" "text" NOT NULL,
    "sha256" "text" NOT NULL,
    "byte_length" integer NOT NULL,
    "stored_name" "text" NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "author_id" "text" NOT NULL,
    "language" "text" NOT NULL,
    "template_id" "text" NOT NULL,
    "team_id" "text" NOT NULL,
    "cycle_id" "text" NOT NULL,
    "cycle_status" "text" NOT NULL,
    "snapshot_version" integer,
    "manifest" "jsonb" NOT NULL,
    "operation_id" "text",
    CONSTRAINT "smn_report_pdf_archive_language_check" CHECK (("language" = ANY (ARRAY['fr'::"text", 'en'::"text"])))
);


--
-- Name: smn_report_render_reference; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_report_render_reference" (
    "id" "text" NOT NULL,
    "sprint_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "text" NOT NULL,
    "sha256" "text" NOT NULL,
    "payload" "jsonb" NOT NULL
);


--
-- Name: smn_report_section_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_report_section_options" (
    "sprint_id" "text" NOT NULL,
    "options" "jsonb" NOT NULL,
    "revision" integer NOT NULL,
    "updated_by" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_report_section_options_revision_check" CHECK (("revision" > 0))
);


--
-- Name: smn_report_section_options_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_report_section_options_audit" (
    "id" "text" NOT NULL,
    "sprint_id" "text" NOT NULL,
    "revision" integer NOT NULL,
    "options" "jsonb" NOT NULL,
    "actor_id" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_report_studio_archive_snapshot; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_report_studio_archive_snapshot" (
    "archive_id" "text" NOT NULL,
    "document_id" "text" NOT NULL,
    "version" integer NOT NULL,
    "document_revision" integer NOT NULL,
    "source_sha256" "text" NOT NULL,
    "snapshot" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_report_studio_archive_snapshot_document_revision_check" CHECK (("document_revision" >= 1)),
    CONSTRAINT "smn_report_studio_archive_snapshot_snapshot_check" CHECK (("jsonb_typeof"("snapshot") = 'object'::"text")),
    CONSTRAINT "smn_report_studio_archive_snapshot_source_sha256_check" CHECK (("source_sha256" ~ '^[0-9a-f]{64}$'::"text")),
    CONSTRAINT "smn_report_studio_archive_snapshot_version_check" CHECK (("version" >= 1))
);


--
-- Name: smn_report_team_context_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_report_team_context_options" (
    "sprint_id" "text" NOT NULL,
    "options" "jsonb" NOT NULL,
    "revision" integer NOT NULL,
    "updated_by" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_report_team_context_options_revision_check" CHECK (("revision" > 0))
);


--
-- Name: smn_report_template; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_report_template" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "sections" "jsonb" NOT NULL,
    "content" "jsonb" NOT NULL,
    "created_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "history_depth" integer DEFAULT 5 NOT NULL,
    "revision" integer DEFAULT 1 NOT NULL,
    CONSTRAINT "smn_report_template_history_depth_check" CHECK ((("history_depth" >= 1) AND ("history_depth" <= 5))),
    CONSTRAINT "smn_report_template_id_check" CHECK (("id" <> 'standard'::"text"))
);


--
-- Name: smn_risk_assessment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_risk_assessment" (
    "item_id" "text" NOT NULL,
    "probability" smallint,
    "impact" smallint,
    "revision" integer DEFAULT 1 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "text",
    CONSTRAINT "smn_risk_assessment_impact_check" CHECK ((("impact" >= 1) AND ("impact" <= 3))),
    CONSTRAINT "smn_risk_assessment_probability_check" CHECK ((("probability" >= 1) AND ("probability" <= 3))),
    CONSTRAINT "smn_risk_assessment_revision_check" CHECK (("revision" > 0))
);


--
-- Name: smn_risk_assessment_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_risk_assessment_audit" (
    "id" "text" NOT NULL,
    "item_id" "text" NOT NULL,
    "revision" integer NOT NULL,
    "old_values" "jsonb",
    "new_values" "jsonb" NOT NULL,
    "actor_id" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_risk_roam; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_risk_roam" (
    "item_id" "text" NOT NULL,
    "classification" "text" NOT NULL,
    "revision" integer DEFAULT 1 NOT NULL,
    "updated_by" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_risk_roam_classification_check" CHECK (("classification" = ANY (ARRAY['resolved'::"text", 'owned'::"text", 'accepted'::"text", 'mitigated'::"text"]))),
    CONSTRAINT "smn_risk_roam_revision_check" CHECK (("revision" > 0))
);


--
-- Name: smn_risk_roam_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_risk_roam_audit" (
    "id" "text" NOT NULL,
    "item_id" "text" NOT NULL,
    "revision" integer NOT NULL,
    "previous_classification" "text",
    "next_classification" "text" NOT NULL,
    "actor_id" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_risk_roam_audit_revision_check" CHECK (("revision" > 0))
);


--
-- Name: smn_scrum_cadence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_scrum_cadence" (
    "team_id" "text" NOT NULL,
    "duration_weeks" integer DEFAULT 2 NOT NULL,
    "start_day" integer DEFAULT 1 NOT NULL,
    "start_time" time without time zone DEFAULT '09:00:00'::time without time zone NOT NULL,
    "end_day" integer DEFAULT 5 NOT NULL,
    "end_time" time without time zone DEFAULT '18:00:00'::time without time zone NOT NULL,
    "time_zone" "text" DEFAULT 'Europe/Paris'::"text" NOT NULL,
    "revision" integer DEFAULT 1 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "text",
    CONSTRAINT "smn_scrum_cadence_check" CHECK ((("end_day" > "start_day") OR (("end_day" = "start_day") AND ("end_time" > "start_time")))),
    CONSTRAINT "smn_scrum_cadence_duration_weeks_check" CHECK ((("duration_weeks" >= 1) AND ("duration_weeks" <= 4))),
    CONSTRAINT "smn_scrum_cadence_end_day_check" CHECK ((("end_day" >= 1) AND ("end_day" <= 7))),
    CONSTRAINT "smn_scrum_cadence_revision_check" CHECK (("revision" >= 1)),
    CONSTRAINT "smn_scrum_cadence_start_day_check" CHECK ((("start_day" >= 1) AND ("start_day" <= 7)))
);


--
-- Name: smn_scrum_cadence_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_scrum_cadence_audit" (
    "id" "text" NOT NULL,
    "team_id" "text" NOT NULL,
    "revision" integer NOT NULL,
    "before_values" "jsonb" NOT NULL,
    "after_values" "jsonb" NOT NULL,
    "changed_by" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_scrum_ceremony_template; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_scrum_ceremony_template" (
    "id" "text" NOT NULL,
    "team_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "frequency" "text" NOT NULL,
    "weekday" integer,
    "position" "text",
    "local_time" time without time zone NOT NULL,
    "duration_minutes" integer NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "revision" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_scrum_ceremony_template_check" CHECK (((("frequency" = 'daily'::"text") AND ("weekday" IS NULL) AND ("position" IS NULL)) OR (("frequency" = 'weekly'::"text") AND ("weekday" IS NOT NULL) AND ("position" IS NULL)) OR (("frequency" = 'sprint'::"text") AND ("weekday" IS NULL) AND ("position" IS NOT NULL)))),
    CONSTRAINT "smn_scrum_ceremony_template_duration_minutes_check" CHECK ((("duration_minutes" >= 1) AND ("duration_minutes" <= 480))),
    CONSTRAINT "smn_scrum_ceremony_template_frequency_check" CHECK (("frequency" = ANY (ARRAY['daily'::"text", 'weekly'::"text", 'sprint'::"text"]))),
    CONSTRAINT "smn_scrum_ceremony_template_name_check" CHECK ((("length"("btrim"("name")) >= 1) AND ("length"("btrim"("name")) <= 120))),
    CONSTRAINT "smn_scrum_ceremony_template_position_check" CHECK (("position" = ANY (ARRAY['start'::"text", 'end'::"text"]))),
    CONSTRAINT "smn_scrum_ceremony_template_weekday_check" CHECK ((("weekday" >= 1) AND ("weekday" <= 7)))
);


--
-- Name: smn_scrum_ceremony_template_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_scrum_ceremony_template_history" (
    "id" "text" NOT NULL,
    "template_id" "text" NOT NULL,
    "revision" integer NOT NULL,
    "before_values" "jsonb",
    "after_values" "jsonb" NOT NULL,
    "actor_id" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_scrum_lunch; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_scrum_lunch" (
    "team_id" "text" NOT NULL,
    "start_time" time without time zone DEFAULT '12:00:00'::time without time zone NOT NULL,
    "end_time" time without time zone DEFAULT '13:00:00'::time without time zone NOT NULL,
    "revision" integer DEFAULT 1 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_scrum_lunch_check" CHECK (("start_time" < "end_time")),
    CONSTRAINT "smn_scrum_lunch_revision_check" CHECK (("revision" > 0))
);


--
-- Name: smn_scrum_template_occurrence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_scrum_template_occurrence" (
    "id" "text" NOT NULL,
    "template_id" "text" NOT NULL,
    "template_revision" integer NOT NULL,
    "sprint_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "starts_at" timestamp with time zone NOT NULL,
    "ends_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "status_explicit" boolean DEFAULT false NOT NULL,
    "actual_minutes" integer,
    "generation_source" "text" DEFAULT 'standard'::"text" NOT NULL,
    "revision" integer DEFAULT 1 NOT NULL,
    CONSTRAINT "smn_scrum_template_occurrence_actual_minutes_check" CHECK ((("actual_minutes" >= 0) AND ("actual_minutes" <= 1440))),
    CONSTRAINT "smn_scrum_template_occurrence_check" CHECK (("ends_at" > "starts_at")),
    CONSTRAINT "smn_scrum_template_occurrence_revision_check" CHECK (("revision" >= 1))
);


--
-- Name: smn_scrum_template_occurrence_status_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_scrum_template_occurrence_status_history" (
    "id" "text" NOT NULL,
    "occurrence_id" "text" CONSTRAINT "smn_scrum_template_occurrence_status_his_occurrence_id_not_null" NOT NULL,
    "previous_status" "text" CONSTRAINT "smn_scrum_template_occurrence_status_h_previous_status_not_null" NOT NULL,
    "next_status" "text" CONSTRAINT "smn_scrum_template_occurrence_status_histo_next_status_not_null" NOT NULL,
    "reason" "text",
    "actor_id" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() CONSTRAINT "smn_scrum_template_occurrence_status_histor_changed_at_not_null" NOT NULL
);


--
-- Name: smn_sprint; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_sprint" (
    "id" "text" NOT NULL,
    "team_id" "text" NOT NULL,
    "number" integer NOT NULL,
    "name" "text" NOT NULL,
    "start_at" timestamp with time zone NOT NULL,
    "end_at" timestamp with time zone NOT NULL,
    "time_zone" "text" NOT NULL,
    "status" "text" DEFAULT 'planned'::"text" NOT NULL,
    "created_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "deleted_by" "text",
    "auto_suspended" boolean DEFAULT false NOT NULL,
    CONSTRAINT "smn_sprint_check" CHECK (("end_at" > "start_at")),
    CONSTRAINT "smn_sprint_name_check" CHECK ((("length"("btrim"("name")) >= 1) AND ("length"("btrim"("name")) <= 160))),
    CONSTRAINT "smn_sprint_number_check" CHECK (("number" > 0))
);


--
-- Name: smn_sprint_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_sprint_audit" (
    "id" "text" NOT NULL,
    "sprint_id" "text" NOT NULL,
    "action" "text" NOT NULL,
    "actor_id" "text",
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "details" "jsonb" NOT NULL
);


--
-- Name: smn_sprint_batch_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_sprint_batch_audit" (
    "id" "text" NOT NULL,
    "team_id" "text" NOT NULL,
    "actor_id" "text",
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "cadence" "jsonb" NOT NULL,
    "sprints" "jsonb" NOT NULL
);


--
-- Name: smn_sprint_batch_preview; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_sprint_batch_preview" (
    "token" "text" NOT NULL,
    "team_id" "text" NOT NULL,
    "actor_id" "text" NOT NULL,
    "start_on" "date" NOT NULL,
    "count" integer NOT NULL,
    "digest" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "consumed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_sprint_batch_preview_count_check" CHECK ((("count" >= 2) AND ("count" <= 6)))
);


--
-- Name: smn_sprint_capacity_kpi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_sprint_capacity_kpi" (
    "sprint_id" "text" NOT NULL,
    "planned_jh" numeric(13,4),
    "actual_jh" numeric(13,4),
    "revision" integer DEFAULT 1 NOT NULL,
    "updated_by" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_sprint_capacity_kpi_actual_jh_check" CHECK ((("actual_jh" >= (0)::numeric) AND ("actual_jh" <= 99999999.9999))),
    CONSTRAINT "smn_sprint_capacity_kpi_planned_jh_check" CHECK ((("planned_jh" >= (0)::numeric) AND ("planned_jh" <= 99999999.9999))),
    CONSTRAINT "smn_sprint_capacity_kpi_revision_check" CHECK (("revision" > 0))
);


--
-- Name: smn_sprint_capacity_kpi_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_sprint_capacity_kpi_audit" (
    "id" "text" NOT NULL,
    "sprint_id" "text" NOT NULL,
    "before_values" "jsonb",
    "after_values" "jsonb" NOT NULL,
    "actor_id" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_sprint_capacity_trigger; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_sprint_capacity_trigger" (
    "sprint_id" "text" NOT NULL,
    "due_at" timestamp with time zone NOT NULL,
    "requested_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    CONSTRAINT "smn_sprint_capacity_trigger_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processed'::"text", 'failed'::"text"])))
);


--
-- Name: smn_sprint_ceremony; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_sprint_ceremony" (
    "id" "text" NOT NULL,
    "sprint_id" "text" NOT NULL,
    "kind" "text" NOT NULL,
    "starts_at" timestamp with time zone NOT NULL,
    "ends_at" timestamp with time zone NOT NULL,
    "minutes" integer NOT NULL,
    "generated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "provenance" "text" DEFAULT 'generated'::"text" NOT NULL,
    "occurrence_status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "revision" integer DEFAULT 1 NOT NULL,
    "status_explicit" boolean DEFAULT false NOT NULL,
    "actual_minutes" integer,
    "generation_source" "text" DEFAULT 'standard'::"text" NOT NULL,
    CONSTRAINT "smn_sprint_ceremony_actual_minutes_check" CHECK ((("actual_minutes" >= 0) AND ("actual_minutes" <= 1440))),
    CONSTRAINT "smn_sprint_ceremony_check" CHECK (("ends_at" > "starts_at")),
    CONSTRAINT "smn_sprint_ceremony_kind_check" CHECK (("kind" = ANY (ARRAY['planning'::"text", 'daily'::"text", 'review'::"text", 'retrospective'::"text"]))),
    CONSTRAINT "smn_sprint_ceremony_minutes_check" CHECK (("minutes" > 0))
);


--
-- Name: smn_sprint_ceremony_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_sprint_ceremony_history" (
    "id" "text" NOT NULL,
    "ceremony_id" "text" NOT NULL,
    "revision" integer NOT NULL,
    "previous_values" "jsonb" NOT NULL,
    "next_values" "jsonb" NOT NULL,
    "changed_by" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_sprint_ceremony_segment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_sprint_ceremony_segment" (
    "ceremony_id" "text" NOT NULL,
    "position" integer NOT NULL,
    "starts_at" timestamp with time zone NOT NULL,
    "ends_at" timestamp with time zone NOT NULL,
    "minutes" integer NOT NULL,
    CONSTRAINT "smn_sprint_ceremony_segment_check" CHECK (("ends_at" > "starts_at")),
    CONSTRAINT "smn_sprint_ceremony_segment_minutes_check" CHECK (("minutes" > 0)),
    CONSTRAINT "smn_sprint_ceremony_segment_position_check" CHECK (("position" > 0))
);


--
-- Name: smn_sprint_ceremony_status_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_sprint_ceremony_status_history" (
    "id" "text" NOT NULL,
    "ceremony_id" "text" NOT NULL,
    "previous_status" "text" NOT NULL,
    "next_status" "text" NOT NULL,
    "reason" "text",
    "actor_id" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_sprint_closure_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_sprint_closure_audit" (
    "id" "text" NOT NULL,
    "sprint_id" "text" NOT NULL,
    "operation" "text" NOT NULL,
    "previous_status" "text" NOT NULL,
    "next_status" "text" NOT NULL,
    "snapshot_version" integer,
    "actor_id" "text",
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_sprint_closure_audit_operation_check" CHECK (("operation" = ANY (ARRAY['close'::"text", 'reopen'::"text"])))
);


--
-- Name: smn_sprint_closure_snapshot; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_sprint_closure_snapshot" (
    "id" "text" NOT NULL,
    "sprint_id" "text" NOT NULL,
    "version" integer NOT NULL,
    "snapshot" "jsonb" NOT NULL,
    "actor_id" "text",
    "closed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_sprint_closure_snapshot_version_check" CHECK (("version" >= 1))
);


--
-- Name: smn_sprint_exceptional_meeting; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_sprint_exceptional_meeting" (
    "id" "text" NOT NULL,
    "sprint_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "starts_at" timestamp with time zone NOT NULL,
    "ends_at" timestamp with time zone NOT NULL,
    "duration_minutes" integer NOT NULL,
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "created_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "revised_at" timestamp with time zone,
    "status_explicit" boolean DEFAULT false NOT NULL,
    "actual_minutes" integer,
    "impacts_capacity" boolean DEFAULT false NOT NULL,
    "revision" integer DEFAULT 1 NOT NULL,
    "generation_source" "text" DEFAULT 'manual'::"text" NOT NULL,
    CONSTRAINT "smn_sprint_exceptional_meeting_actual_minutes_check" CHECK ((("actual_minutes" >= 0) AND ("actual_minutes" <= 1440))),
    CONSTRAINT "smn_sprint_exceptional_meeting_check" CHECK (("ends_at" > "starts_at")),
    CONSTRAINT "smn_sprint_exceptional_meeting_duration_minutes_check" CHECK ((("duration_minutes" >= 1) AND ("duration_minutes" <= 480))),
    CONSTRAINT "smn_sprint_exceptional_meeting_name_check" CHECK ((("length"("btrim"("name")) >= 1) AND ("length"("btrim"("name")) <= 160))),
    CONSTRAINT "smn_sprint_exceptional_meeting_revision_check" CHECK (("revision" >= 1))
);


--
-- Name: smn_sprint_exceptional_meeting_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_sprint_exceptional_meeting_history" (
    "id" "text" NOT NULL,
    "meeting_id" "text" NOT NULL,
    "action" "text" NOT NULL,
    "actor_id" "text",
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "details" "jsonb" NOT NULL
);


--
-- Name: smn_sprint_exceptional_meeting_status_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_sprint_exceptional_meeting_status_history" (
    "id" "text" NOT NULL,
    "meeting_id" "text" CONSTRAINT "smn_sprint_exceptional_meeting_status_histo_meeting_id_not_null" NOT NULL,
    "previous_status" "text" CONSTRAINT "smn_sprint_exceptional_meeting_status__previous_status_not_null" NOT NULL,
    "next_status" "text" CONSTRAINT "smn_sprint_exceptional_meeting_status_hist_next_status_not_null" NOT NULL,
    "reason" "text",
    "actor_id" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() CONSTRAINT "smn_sprint_exceptional_meeting_status_histo_changed_at_not_null" NOT NULL
);


--
-- Name: smn_sprint_goal; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_sprint_goal" (
    "id" "text" NOT NULL,
    "sprint_id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "evaluation" "text" DEFAULT 'not_evaluated'::"text" NOT NULL,
    "comment" "text",
    "revision" integer DEFAULT 1 NOT NULL,
    "created_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_sprint_goal_evaluation_check" CHECK (("evaluation" = ANY (ARRAY['not_evaluated'::"text", 'achieved'::"text", 'partially_achieved'::"text", 'not_achieved'::"text"]))),
    CONSTRAINT "smn_sprint_goal_revision_check" CHECK (("revision" > 0)),
    CONSTRAINT "smn_sprint_goal_title_check" CHECK ((("length"("btrim"("title")) >= 1) AND ("length"("btrim"("title")) <= 240)))
);


--
-- Name: smn_sprint_goal_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_sprint_goal_audit" (
    "id" "text" NOT NULL,
    "goal_id" "text" NOT NULL,
    "previous_values" "jsonb",
    "next_values" "jsonb" NOT NULL,
    "actor_id" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_sprint_historical_actual_capacity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_sprint_historical_actual_capacity" (
    "sprint_id" "text" NOT NULL,
    "quality" "text" NOT NULL,
    "qualified_jh" numeric(13,4),
    "source_ref" "text",
    "reason" "text",
    "revision" integer DEFAULT 1 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "text",
    CONSTRAINT "smn_sprint_historical_actual_capacity_check" CHECK (((("quality" = 'not-supplied'::"text") AND ("qualified_jh" IS NULL)) OR (("quality" <> 'not-supplied'::"text") AND ("qualified_jh" IS NOT NULL)))),
    CONSTRAINT "smn_sprint_historical_actual_capacity_quality_check" CHECK (("quality" = ANY (ARRAY['known'::"text", 'estimated'::"text", 'not-supplied'::"text"])))
);


--
-- Name: smn_sprint_historical_actual_capacity_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_sprint_historical_actual_capacity_audit" (
    "id" "text" NOT NULL,
    "sprint_id" "text" NOT NULL,
    "before_values" "jsonb",
    "after_values" "jsonb" CONSTRAINT "smn_sprint_historical_actual_capacity_aud_after_values_not_null" NOT NULL,
    "actor_id" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_sprint_historical_capacity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_sprint_historical_capacity" (
    "sprint_id" "text" NOT NULL,
    "quality" "text" NOT NULL,
    "qualified_jh" numeric(13,4),
    "source_ref" "text",
    "reason" "text",
    "revision" integer DEFAULT 1 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "text",
    CONSTRAINT "smn_sprint_historical_capacity_check" CHECK (((("quality" = 'not-supplied'::"text") AND ("qualified_jh" IS NULL)) OR (("quality" <> 'not-supplied'::"text") AND ("qualified_jh" IS NOT NULL)))),
    CONSTRAINT "smn_sprint_historical_capacity_quality_check" CHECK (("quality" = ANY (ARRAY['known'::"text", 'estimated'::"text", 'not-supplied'::"text"])))
);


--
-- Name: smn_sprint_historical_capacity_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_sprint_historical_capacity_audit" (
    "id" "text" NOT NULL,
    "sprint_id" "text" NOT NULL,
    "before_values" "jsonb",
    "after_values" "jsonb" NOT NULL,
    "actor_id" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_sprint_historical_event; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_sprint_historical_event" (
    "meeting_id" "text" NOT NULL,
    "kind" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_sprint_historical_goal_detail; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_sprint_historical_goal_detail" (
    "goal_id" "text" NOT NULL,
    "description" "text",
    "source" "text",
    "recorded_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "recorded_by" "text"
);


--
-- Name: smn_sprint_historical_request; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_sprint_historical_request" (
    "operation_id" "text" NOT NULL,
    "actor_id" "text" NOT NULL,
    "request_json" "jsonb" NOT NULL,
    "sprint_id" "text" NOT NULL
);


--
-- Name: smn_sprint_reschedule_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_sprint_reschedule_audit" (
    "id" "text" NOT NULL,
    "sprint_id" "text" NOT NULL,
    "old_start" timestamp with time zone NOT NULL,
    "old_end" timestamp with time zone NOT NULL,
    "new_start" timestamp with time zone NOT NULL,
    "new_end" timestamp with time zone NOT NULL,
    "mode" "text" NOT NULL,
    "actor_id" "text",
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_sprint_review_analysis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_sprint_review_analysis" (
    "sprint_id" "text" NOT NULL,
    "kind" "text" NOT NULL,
    "body" "text",
    "revision" integer DEFAULT 1 NOT NULL,
    "origin" "text" DEFAULT 'human'::"text" NOT NULL,
    "human_edited" boolean DEFAULT true NOT NULL,
    "generation_id" "text",
    "updated_by" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_sprint_review_analysis_body_check" CHECK ((("body" IS NULL) OR ("length"("body") <= 3000))),
    CONSTRAINT "smn_sprint_review_analysis_kind_check" CHECK (("kind" = ANY (ARRAY['manual'::"text", 'ai'::"text"]))),
    CONSTRAINT "smn_sprint_review_analysis_origin_check" CHECK (("origin" = ANY (ARRAY['human'::"text", 'ai-generated'::"text", 'human-edited-ai'::"text"]))),
    CONSTRAINT "smn_sprint_review_analysis_revision_check" CHECK (("revision" > 0))
);


--
-- Name: smn_sprint_review_analysis_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_sprint_review_analysis_audit" (
    "id" "text" NOT NULL,
    "sprint_id" "text" NOT NULL,
    "kind" "text" NOT NULL,
    "previous_values" "jsonb",
    "next_values" "jsonb" NOT NULL,
    "actor_id" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_sprint_review_analysis_audit_kind_check" CHECK (("kind" = ANY (ARRAY['manual'::"text", 'ai'::"text"])))
);


--
-- Name: smn_sprint_scores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_sprint_scores" (
    "sprint_id" "text" NOT NULL,
    "confidence" smallint,
    "clarity" smallint,
    "revision" integer DEFAULT 1 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "text",
    CONSTRAINT "smn_sprint_scores_clarity_check" CHECK ((("clarity" >= 1) AND ("clarity" <= 5))),
    CONSTRAINT "smn_sprint_scores_confidence_check" CHECK ((("confidence" >= 1) AND ("confidence" <= 5))),
    CONSTRAINT "smn_sprint_scores_revision_check" CHECK (("revision" > 0))
);


--
-- Name: smn_sprint_scores_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_sprint_scores_audit" (
    "id" "text" NOT NULL,
    "sprint_id" "text" NOT NULL,
    "before_values" "jsonb",
    "after_values" "jsonb" NOT NULL,
    "actor_id" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_sprint_story_points; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_sprint_story_points" (
    "sprint_id" "text" NOT NULL,
    "initial_sp" bigint,
    "added_sp" bigint,
    "removed_sp" bigint,
    "done_sp" bigint,
    "revision" integer DEFAULT 1 NOT NULL,
    "updated_by" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "smn_sprint_story_points_added_sp_check" CHECK ((("added_sp" >= 0) AND ("added_sp" <= 1000000000))),
    CONSTRAINT "smn_sprint_story_points_done_sp_check" CHECK ((("done_sp" >= 0) AND ("done_sp" <= 1000000000))),
    CONSTRAINT "smn_sprint_story_points_initial_sp_check" CHECK ((("initial_sp" >= 0) AND ("initial_sp" <= 1000000000))),
    CONSTRAINT "smn_sprint_story_points_removed_sp_check" CHECK ((("removed_sp" >= 0) AND ("removed_sp" <= 1000000000)))
);


--
-- Name: smn_sprint_story_points_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_sprint_story_points_audit" (
    "id" "text" NOT NULL,
    "sprint_id" "text" NOT NULL,
    "before_values" "jsonb",
    "after_values" "jsonb" NOT NULL,
    "actor_id" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_sprint_ticket_counts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_sprint_ticket_counts" (
    "sprint_id" "text" NOT NULL,
    "initial_tickets" bigint,
    "done_tickets" bigint,
    "revision" integer DEFAULT 1 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "text",
    CONSTRAINT "smn_sprint_ticket_counts_done_tickets_check" CHECK ((("done_tickets" >= 0) AND ("done_tickets" <= 1000000000))),
    CONSTRAINT "smn_sprint_ticket_counts_initial_tickets_check" CHECK ((("initial_tickets" >= 0) AND ("initial_tickets" <= 1000000000)))
);


--
-- Name: smn_sprint_ticket_counts_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_sprint_ticket_counts_audit" (
    "id" "text" NOT NULL,
    "sprint_id" "text" NOT NULL,
    "before_values" "jsonb",
    "after_values" "jsonb" NOT NULL,
    "actor_id" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_sprint_transition; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_sprint_transition" (
    "id" "text" NOT NULL,
    "sprint_id" "text" NOT NULL,
    "transition" "text" NOT NULL,
    "business_at" timestamp with time zone NOT NULL,
    "processed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "actor_id" "text",
    CONSTRAINT "smn_sprint_transition_transition_check" CHECK (("transition" = ANY (ARRAY['started'::"text", 'ended'::"text", 'suspended'::"text", 'resumed'::"text"])))
);


--
-- Name: smn_sprint_wizard_preview; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_sprint_wizard_preview" (
    "token" "text" NOT NULL,
    "team_id" "text" NOT NULL,
    "actor_id" "text" NOT NULL,
    "request" "jsonb" NOT NULL,
    "digest" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "consumed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: smn_team; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_team" (
    "id" "text" NOT NULL,
    "installation_id" "text" NOT NULL,
    "product_id" "text",
    "name" "text" NOT NULL,
    "agile_mode" "text" NOT NULL,
    "is_archived" boolean DEFAULT false NOT NULL,
    CONSTRAINT "smn_team_agile_mode_check" CHECK (("agile_mode" = ANY (ARRAY['scrum'::"text", 'kanban'::"text"])))
);


--
-- Name: smn_team_context; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_team_context" (
    "team_id" "text" NOT NULL,
    "vision" "text",
    "product_goal" "text",
    "dod" "text",
    "dor" "text",
    "language" "text",
    "revision" integer DEFAULT 1 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "text",
    CONSTRAINT "smn_team_context_revision_check" CHECK (("revision" > 0))
);


--
-- Name: smn_team_context_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."smn_team_context_audit" (
    "id" "text" NOT NULL,
    "team_id" "text" NOT NULL,
    "revision" integer NOT NULL,
    "before_values" "jsonb" NOT NULL,
    "after_values" "jsonb" NOT NULL,
    "actor_id" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."_prisma_migrations"
    ADD CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id");


--
-- Name: smn_absence_category smn_absence_category_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_absence_category"
    ADD CONSTRAINT "smn_absence_category_pkey" PRIMARY KEY ("id");


--
-- Name: smn_account_audit smn_account_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_account_audit"
    ADD CONSTRAINT "smn_account_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_account smn_account_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_account"
    ADD CONSTRAINT "smn_account_email_key" UNIQUE ("email");


--
-- Name: smn_account smn_account_installation_pair_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_account"
    ADD CONSTRAINT "smn_account_installation_pair_key" UNIQUE ("id", "installation_id");


--
-- Name: smn_account smn_account_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_account"
    ADD CONSTRAINT "smn_account_pkey" PRIMARY KEY ("id");


--
-- Name: smn_account_team_preference smn_account_team_preference_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_account_team_preference"
    ADD CONSTRAINT "smn_account_team_preference_pkey" PRIMARY KEY ("account_id");


--
-- Name: smn_account smn_account_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_account"
    ADD CONSTRAINT "smn_account_username_key" UNIQUE ("username");


--
-- Name: smn_action_link_audit smn_action_link_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_action_link_audit"
    ADD CONSTRAINT "smn_action_link_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_action_link smn_action_link_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_action_link"
    ADD CONSTRAINT "smn_action_link_pkey" PRIMARY KEY ("action_id", "related_id");


--
-- Name: smn_ai_brief_archive smn_ai_brief_archive_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_ai_brief_archive"
    ADD CONSTRAINT "smn_ai_brief_archive_pkey" PRIMARY KEY ("id");


--
-- Name: smn_ai_brief_draft smn_ai_brief_draft_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_ai_brief_draft"
    ADD CONSTRAINT "smn_ai_brief_draft_pkey" PRIMARY KEY ("id");


--
-- Name: smn_ai_brief_response smn_ai_brief_response_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_ai_brief_response"
    ADD CONSTRAINT "smn_ai_brief_response_pkey" PRIMARY KEY ("id");


--
-- Name: smn_ai_brief_template smn_ai_brief_template_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_ai_brief_template"
    ADD CONSTRAINT "smn_ai_brief_template_pkey" PRIMARY KEY ("id");


--
-- Name: smn_auth_audit smn_auth_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_auth_audit"
    ADD CONSTRAINT "smn_auth_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_automatic_highlight smn_automatic_highlight_category_source_kind_source_id_sour_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_automatic_highlight"
    ADD CONSTRAINT "smn_automatic_highlight_category_source_kind_source_id_sour_key" UNIQUE ("category", "source_kind", "source_id", "source_revision");


--
-- Name: smn_automatic_highlight smn_automatic_highlight_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_automatic_highlight"
    ADD CONSTRAINT "smn_automatic_highlight_pkey" PRIMARY KEY ("id");


--
-- Name: smn_automatic_highlight_settings smn_automatic_highlight_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_automatic_highlight_settings"
    ADD CONSTRAINT "smn_automatic_highlight_settings_pkey" PRIMARY KEY ("installation_id", "category");


--
-- Name: smn_backup_retention_audit smn_backup_retention_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_backup_retention_audit"
    ADD CONSTRAINT "smn_backup_retention_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_backup_retention smn_backup_retention_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_backup_retention"
    ADD CONSTRAINT "smn_backup_retention_pkey" PRIMARY KEY ("installation_id");


--
-- Name: smn_calendar_meeting_outcome_link smn_calendar_meeting_outcome_link_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_calendar_meeting_outcome_link"
    ADD CONSTRAINT "smn_calendar_meeting_outcome_link_pkey" PRIMARY KEY ("registry_item_id");


--
-- Name: smn_calendar_meeting_schedule_history smn_calendar_meeting_schedule_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_calendar_meeting_schedule_history"
    ADD CONSTRAINT "smn_calendar_meeting_schedule_history_pkey" PRIMARY KEY ("id");


--
-- Name: smn_capacity_actual_override_history smn_capacity_actual_override_history_actual_id_revision_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_actual_override_history"
    ADD CONSTRAINT "smn_capacity_actual_override_history_actual_id_revision_key" UNIQUE ("actual_id", "revision");


--
-- Name: smn_capacity_actual_override_history smn_capacity_actual_override_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_actual_override_history"
    ADD CONSTRAINT "smn_capacity_actual_override_history_pkey" PRIMARY KEY ("id");


--
-- Name: smn_capacity_actual_override smn_capacity_actual_override_period_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_actual_override"
    ADD CONSTRAINT "smn_capacity_actual_override_period_id_key" UNIQUE ("period_id");


--
-- Name: smn_capacity_actual_override smn_capacity_actual_override_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_actual_override"
    ADD CONSTRAINT "smn_capacity_actual_override_pkey" PRIMARY KEY ("id");


--
-- Name: smn_capacity_actual_snapshot smn_capacity_actual_snapshot_event_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_actual_snapshot"
    ADD CONSTRAINT "smn_capacity_actual_snapshot_event_id_key" UNIQUE ("event_id");


--
-- Name: smn_capacity_actual_snapshot smn_capacity_actual_snapshot_period_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_actual_snapshot"
    ADD CONSTRAINT "smn_capacity_actual_snapshot_period_id_key" UNIQUE ("period_id");


--
-- Name: smn_capacity_actual_snapshot smn_capacity_actual_snapshot_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_actual_snapshot"
    ADD CONSTRAINT "smn_capacity_actual_snapshot_pkey" PRIMARY KEY ("id");


--
-- Name: smn_capacity_historical_quality_history smn_capacity_historical_quality_h_qualification_id_revision_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_historical_quality_history"
    ADD CONSTRAINT "smn_capacity_historical_quality_h_qualification_id_revision_key" UNIQUE ("qualification_id", "revision");


--
-- Name: smn_capacity_historical_quality_history smn_capacity_historical_quality_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_historical_quality_history"
    ADD CONSTRAINT "smn_capacity_historical_quality_history_pkey" PRIMARY KEY ("id");


--
-- Name: smn_capacity_historical_quality smn_capacity_historical_quality_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_historical_quality"
    ADD CONSTRAINT "smn_capacity_historical_quality_pkey" PRIMARY KEY ("id");


--
-- Name: smn_capacity_historical_quality smn_capacity_historical_quality_team_id_start_on_end_on_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_historical_quality"
    ADD CONSTRAINT "smn_capacity_historical_quality_team_id_start_on_end_on_key" UNIQUE ("team_id", "start_on", "end_on");


--
-- Name: smn_capacity_initial_snapshot smn_capacity_initial_snapshot_event_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_initial_snapshot"
    ADD CONSTRAINT "smn_capacity_initial_snapshot_event_id_key" UNIQUE ("event_id");


--
-- Name: smn_capacity_initial_snapshot smn_capacity_initial_snapshot_period_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_initial_snapshot"
    ADD CONSTRAINT "smn_capacity_initial_snapshot_period_id_key" UNIQUE ("period_id");


--
-- Name: smn_capacity_initial_snapshot smn_capacity_initial_snapshot_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_initial_snapshot"
    ADD CONSTRAINT "smn_capacity_initial_snapshot_pkey" PRIMARY KEY ("id");


--
-- Name: smn_capacity_period_override_history smn_capacity_period_override_history_period_id_revision_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_period_override_history"
    ADD CONSTRAINT "smn_capacity_period_override_history_period_id_revision_key" UNIQUE ("period_id", "revision");


--
-- Name: smn_capacity_period_override_history smn_capacity_period_override_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_period_override_history"
    ADD CONSTRAINT "smn_capacity_period_override_history_pkey" PRIMARY KEY ("id");


--
-- Name: smn_capacity_period_override smn_capacity_period_override_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_period_override"
    ADD CONSTRAINT "smn_capacity_period_override_pkey" PRIMARY KEY ("id");


--
-- Name: smn_capacity_period_override smn_capacity_period_override_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_period_override"
    ADD CONSTRAINT "smn_capacity_period_override_unique" UNIQUE ("team_id", "start_on", "end_on");


--
-- Name: smn_capacity_replanning_history smn_capacity_replanning_history_event_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_replanning_history"
    ADD CONSTRAINT "smn_capacity_replanning_history_event_id_key" UNIQUE ("event_id");


--
-- Name: smn_capacity_replanning_history smn_capacity_replanning_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_replanning_history"
    ADD CONSTRAINT "smn_capacity_replanning_history_pkey" PRIMARY KEY ("id");


--
-- Name: smn_capacity_replanning_history smn_capacity_replanning_history_replanning_id_revision_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_replanning_history"
    ADD CONSTRAINT "smn_capacity_replanning_history_replanning_id_revision_key" UNIQUE ("replanning_id", "revision");


--
-- Name: smn_capacity_replanning smn_capacity_replanning_period_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_replanning"
    ADD CONSTRAINT "smn_capacity_replanning_period_id_key" UNIQUE ("period_id");


--
-- Name: smn_capacity_replanning smn_capacity_replanning_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_replanning"
    ADD CONSTRAINT "smn_capacity_replanning_pkey" PRIMARY KEY ("id");


--
-- Name: smn_capacity_settings_audit smn_capacity_settings_audit_installation_id_revision_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_settings_audit"
    ADD CONSTRAINT "smn_capacity_settings_audit_installation_id_revision_key" UNIQUE ("installation_id", "revision");


--
-- Name: smn_capacity_settings_audit smn_capacity_settings_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_settings_audit"
    ADD CONSTRAINT "smn_capacity_settings_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_capacity_settings smn_capacity_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_settings"
    ADD CONSTRAINT "smn_capacity_settings_pkey" PRIMARY KEY ("installation_id");


--
-- Name: smn_company_capacity_recalc smn_company_capacity_recalc_closure_id_closure_revision_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_company_capacity_recalc"
    ADD CONSTRAINT "smn_company_capacity_recalc_closure_id_closure_revision_key" UNIQUE ("closure_id", "closure_revision");


--
-- Name: smn_company_capacity_recalc smn_company_capacity_recalc_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_company_capacity_recalc"
    ADD CONSTRAINT "smn_company_capacity_recalc_pkey" PRIMARY KEY ("id");


--
-- Name: smn_company_closure_history smn_company_closure_history_closure_id_revision_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_company_closure_history"
    ADD CONSTRAINT "smn_company_closure_history_closure_id_revision_key" UNIQUE ("closure_id", "revision");


--
-- Name: smn_company_closure_history smn_company_closure_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_company_closure_history"
    ADD CONSTRAINT "smn_company_closure_history_pkey" PRIMARY KEY ("id");


--
-- Name: smn_company_closure smn_company_closure_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_company_closure"
    ADD CONSTRAINT "smn_company_closure_pkey" PRIMARY KEY ("id");


--
-- Name: smn_company smn_company_installation_id_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_company"
    ADD CONSTRAINT "smn_company_installation_id_id_unique" UNIQUE ("installation_id", "id");


--
-- Name: smn_company smn_company_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_company"
    ADD CONSTRAINT "smn_company_pkey" PRIMARY KEY ("id");


--
-- Name: smn_configuration_task smn_configuration_task_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_configuration_task"
    ADD CONSTRAINT "smn_configuration_task_pkey" PRIMARY KEY ("installation_id", "task_key");


--
-- Name: smn_country_lifecycle_audit smn_country_lifecycle_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_country_lifecycle_audit"
    ADD CONSTRAINT "smn_country_lifecycle_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_country_name_audit smn_country_name_audit_country_code_revision_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_country_name_audit"
    ADD CONSTRAINT "smn_country_name_audit_country_code_revision_key" UNIQUE ("country_code", "revision");


--
-- Name: smn_country_name_audit smn_country_name_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_country_name_audit"
    ADD CONSTRAINT "smn_country_name_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_country smn_country_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_country"
    ADD CONSTRAINT "smn_country_pkey" PRIMARY KEY ("code");


--
-- Name: smn_dashboard_event_edit_audit smn_dashboard_event_edit_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_dashboard_event_edit_audit"
    ADD CONSTRAINT "smn_dashboard_event_edit_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_dashboard_note_audit smn_dashboard_note_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_dashboard_note_audit"
    ADD CONSTRAINT "smn_dashboard_note_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_dashboard_note_edit_audit smn_dashboard_note_edit_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_dashboard_note_edit_audit"
    ADD CONSTRAINT "smn_dashboard_note_edit_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_dashboard_note smn_dashboard_note_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_dashboard_note"
    ADD CONSTRAINT "smn_dashboard_note_pkey" PRIMARY KEY ("id");


--
-- Name: smn_decision_detail_audit smn_decision_detail_audit_item_id_revision_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_decision_detail_audit"
    ADD CONSTRAINT "smn_decision_detail_audit_item_id_revision_key" UNIQUE ("item_id", "revision");


--
-- Name: smn_decision_detail_audit smn_decision_detail_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_decision_detail_audit"
    ADD CONSTRAINT "smn_decision_detail_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_decision_detail smn_decision_detail_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_decision_detail"
    ADD CONSTRAINT "smn_decision_detail_pkey" PRIMARY KEY ("item_id");


--
-- Name: smn_dependency_parties_audit smn_dependency_parties_audit_item_id_revision_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_dependency_parties_audit"
    ADD CONSTRAINT "smn_dependency_parties_audit_item_id_revision_key" UNIQUE ("item_id", "revision");


--
-- Name: smn_dependency_parties_audit smn_dependency_parties_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_dependency_parties_audit"
    ADD CONSTRAINT "smn_dependency_parties_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_dependency_parties smn_dependency_parties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_dependency_parties"
    ADD CONSTRAINT "smn_dependency_parties_pkey" PRIMARY KEY ("item_id");


--
-- Name: smn_dependency_vigilance_audit smn_dependency_vigilance_audit_item_id_revision_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_dependency_vigilance_audit"
    ADD CONSTRAINT "smn_dependency_vigilance_audit_item_id_revision_key" UNIQUE ("item_id", "revision");


--
-- Name: smn_dependency_vigilance_audit smn_dependency_vigilance_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_dependency_vigilance_audit"
    ADD CONSTRAINT "smn_dependency_vigilance_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_dependency_vigilance smn_dependency_vigilance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_dependency_vigilance"
    ADD CONSTRAINT "smn_dependency_vigilance_pkey" PRIMARY KEY ("item_id");


--
-- Name: smn_exceptional_capacity_impact_history smn_exceptional_capacity_impact_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_exceptional_capacity_impact_history"
    ADD CONSTRAINT "smn_exceptional_capacity_impact_history_pkey" PRIMARY KEY ("id");


--
-- Name: smn_exceptional_meeting_participant_audit smn_exceptional_meeting_participant_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_exceptional_meeting_participant_audit"
    ADD CONSTRAINT "smn_exceptional_meeting_participant_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_exceptional_meeting_participant smn_exceptional_meeting_participant_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_exceptional_meeting_participant"
    ADD CONSTRAINT "smn_exceptional_meeting_participant_pkey" PRIMARY KEY ("meeting_id", "member_id");


--
-- Name: smn_fact_selection_audit smn_fact_selection_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_fact_selection_audit"
    ADD CONSTRAINT "smn_fact_selection_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_fact_selection smn_fact_selection_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_fact_selection"
    ADD CONSTRAINT "smn_fact_selection_pkey" PRIMARY KEY ("origin", "fact_id");


--
-- Name: smn_general_settings_audit smn_general_settings_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_general_settings_audit"
    ADD CONSTRAINT "smn_general_settings_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_general_settings smn_general_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_general_settings"
    ADD CONSTRAINT "smn_general_settings_pkey" PRIMARY KEY ("installation_id");


--
-- Name: smn_historical_csv_attempt smn_historical_csv_attempt_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_historical_csv_attempt"
    ADD CONSTRAINT "smn_historical_csv_attempt_pkey" PRIMARY KEY ("id");


--
-- Name: smn_historical_csv_batch smn_historical_csv_batch_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_historical_csv_batch"
    ADD CONSTRAINT "smn_historical_csv_batch_pkey" PRIMARY KEY ("id");


--
-- Name: smn_historical_csv_change smn_historical_csv_change_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_historical_csv_change"
    ADD CONSTRAINT "smn_historical_csv_change_pkey" PRIMARY KEY ("id");


--
-- Name: smn_human_analysis smn_human_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_human_analysis"
    ADD CONSTRAINT "smn_human_analysis_pkey" PRIMARY KEY ("id");


--
-- Name: smn_installation smn_installation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_installation"
    ADD CONSTRAINT "smn_installation_pkey" PRIMARY KEY ("id");


--
-- Name: smn_kanban_batch_audit smn_kanban_batch_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_batch_audit"
    ADD CONSTRAINT "smn_kanban_batch_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_kanban_cadence_audit smn_kanban_cadence_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_cadence_audit"
    ADD CONSTRAINT "smn_kanban_cadence_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_kanban_cadence_audit smn_kanban_cadence_audit_team_id_revision_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_cadence_audit"
    ADD CONSTRAINT "smn_kanban_cadence_audit_team_id_revision_key" UNIQUE ("team_id", "revision");


--
-- Name: smn_kanban_cadence smn_kanban_cadence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_cadence"
    ADD CONSTRAINT "smn_kanban_cadence_pkey" PRIMARY KEY ("team_id");


--
-- Name: smn_kanban_capacity_opening smn_kanban_capacity_opening_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_capacity_opening"
    ADD CONSTRAINT "smn_kanban_capacity_opening_pkey" PRIMARY KEY ("period_id");


--
-- Name: smn_kanban_closure smn_kanban_closure_period_id_version_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_closure"
    ADD CONSTRAINT "smn_kanban_closure_period_id_version_key" UNIQUE ("period_id", "version");


--
-- Name: smn_kanban_closure smn_kanban_closure_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_closure"
    ADD CONSTRAINT "smn_kanban_closure_pkey" PRIMARY KEY ("id");


--
-- Name: smn_kanban_flow_audit smn_kanban_flow_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_flow_audit"
    ADD CONSTRAINT "smn_kanban_flow_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_kanban_flow_counts smn_kanban_flow_counts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_flow_counts"
    ADD CONSTRAINT "smn_kanban_flow_counts_pkey" PRIMARY KEY ("period_id");


--
-- Name: smn_kanban_goal_audit smn_kanban_goal_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_goal_audit"
    ADD CONSTRAINT "smn_kanban_goal_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_kanban_goal smn_kanban_goal_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_goal"
    ADD CONSTRAINT "smn_kanban_goal_pkey" PRIMARY KEY ("id");


--
-- Name: smn_kanban_meeting smn_kanban_meeting_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_meeting"
    ADD CONSTRAINT "smn_kanban_meeting_pkey" PRIMARY KEY ("id");


--
-- Name: smn_kanban_period_audit smn_kanban_period_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_period_audit"
    ADD CONSTRAINT "smn_kanban_period_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_kanban_period smn_kanban_period_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_period"
    ADD CONSTRAINT "smn_kanban_period_pkey" PRIMARY KEY ("id");


--
-- Name: smn_kanban_period_transition smn_kanban_period_transition_period_id_transition_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_period_transition"
    ADD CONSTRAINT "smn_kanban_period_transition_period_id_transition_key" UNIQUE ("period_id", "transition");


--
-- Name: smn_kanban_period_transition smn_kanban_period_transition_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_period_transition"
    ADD CONSTRAINT "smn_kanban_period_transition_pkey" PRIMARY KEY ("id");


--
-- Name: smn_kanban_registry_link_audit smn_kanban_registry_link_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_registry_link_audit"
    ADD CONSTRAINT "smn_kanban_registry_link_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_kanban_registry_link smn_kanban_registry_link_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_registry_link"
    ADD CONSTRAINT "smn_kanban_registry_link_pkey" PRIMARY KEY ("period_id", "item_id");


--
-- Name: smn_kanban_render_reference smn_kanban_render_reference_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_render_reference"
    ADD CONSTRAINT "smn_kanban_render_reference_pkey" PRIMARY KEY ("id");


--
-- Name: smn_kanban_report_analysis_choice smn_kanban_report_analysis_choice_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_report_analysis_choice"
    ADD CONSTRAINT "smn_kanban_report_analysis_choice_pkey" PRIMARY KEY ("period_id");


--
-- Name: smn_kanban_timing_audit smn_kanban_timing_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_timing_audit"
    ADD CONSTRAINT "smn_kanban_timing_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_kanban_timing smn_kanban_timing_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_timing"
    ADD CONSTRAINT "smn_kanban_timing_pkey" PRIMARY KEY ("period_id");


--
-- Name: smn_link_audit smn_link_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_link_audit"
    ADD CONSTRAINT "smn_link_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_link_category smn_link_category_id_installation_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_link_category"
    ADD CONSTRAINT "smn_link_category_id_installation_id_key" UNIQUE ("id", "installation_id");


--
-- Name: smn_link_category smn_link_category_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_link_category"
    ADD CONSTRAINT "smn_link_category_pkey" PRIMARY KEY ("id");


--
-- Name: smn_link smn_link_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_link"
    ADD CONSTRAINT "smn_link_pkey" PRIMARY KEY ("id");


--
-- Name: smn_meeting_actual_duration_audit smn_meeting_actual_duration_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_meeting_actual_duration_audit"
    ADD CONSTRAINT "smn_meeting_actual_duration_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_member_absence_history smn_member_absence_history_absence_id_revision_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_absence_history"
    ADD CONSTRAINT "smn_member_absence_history_absence_id_revision_key" UNIQUE ("absence_id", "revision");


--
-- Name: smn_member_absence_history smn_member_absence_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_absence_history"
    ADD CONSTRAINT "smn_member_absence_history_pkey" PRIMARY KEY ("id");


--
-- Name: smn_member_absence smn_member_absence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_absence"
    ADD CONSTRAINT "smn_member_absence_pkey" PRIMARY KEY ("id");


--
-- Name: smn_member_assignment smn_member_assignment_member_id_team_id_start_on_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_assignment"
    ADD CONSTRAINT "smn_member_assignment_member_id_team_id_start_on_key" UNIQUE ("member_id", "team_id", "start_on");


--
-- Name: smn_member_assignment smn_member_assignment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_assignment"
    ADD CONSTRAINT "smn_member_assignment_pkey" PRIMARY KEY ("id");


--
-- Name: smn_member_assignment_start_audit smn_member_assignment_start_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_assignment_start_audit"
    ADD CONSTRAINT "smn_member_assignment_start_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_member_assignment_version smn_member_assignment_version_assignment_id_revision_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_assignment_version"
    ADD CONSTRAINT "smn_member_assignment_version_assignment_id_revision_key" UNIQUE ("assignment_id", "revision");


--
-- Name: smn_member_assignment_version smn_member_assignment_version_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_assignment_version"
    ADD CONSTRAINT "smn_member_assignment_version_pkey" PRIMARY KEY ("id");


--
-- Name: smn_member_batch smn_member_batch_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_batch"
    ADD CONSTRAINT "smn_member_batch_pkey" PRIMARY KEY ("id");


--
-- Name: smn_member_calendar_exception smn_member_calendar_exception_member_id_on_date_revision_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_calendar_exception"
    ADD CONSTRAINT "smn_member_calendar_exception_member_id_on_date_revision_key" UNIQUE ("member_id", "on_date", "revision");


--
-- Name: smn_member_calendar_exception smn_member_calendar_exception_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_calendar_exception"
    ADD CONSTRAINT "smn_member_calendar_exception_pkey" PRIMARY KEY ("id");


--
-- Name: smn_member_calendar_week smn_member_calendar_week_member_id_revision_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_calendar_week"
    ADD CONSTRAINT "smn_member_calendar_week_member_id_revision_key" UNIQUE ("member_id", "revision");


--
-- Name: smn_member_calendar_week smn_member_calendar_week_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_calendar_week"
    ADD CONSTRAINT "smn_member_calendar_week_pkey" PRIMARY KEY ("id");


--
-- Name: smn_member_identity_history smn_member_identity_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_identity_history"
    ADD CONSTRAINT "smn_member_identity_history_pkey" PRIMARY KEY ("id");


--
-- Name: smn_member smn_member_installation_id_member_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member"
    ADD CONSTRAINT "smn_member_installation_id_member_number_key" UNIQUE ("installation_id", "member_number");


--
-- Name: smn_member_lifecycle_event smn_member_lifecycle_event_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_lifecycle_event"
    ADD CONSTRAINT "smn_member_lifecycle_event_pkey" PRIMARY KEY ("id");


--
-- Name: smn_member_location smn_member_location_member_id_revision_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_location"
    ADD CONSTRAINT "smn_member_location_member_id_revision_key" UNIQUE ("member_id", "revision");


--
-- Name: smn_member_location smn_member_location_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_location"
    ADD CONSTRAINT "smn_member_location_pkey" PRIMARY KEY ("id");


--
-- Name: smn_member smn_member_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member"
    ADD CONSTRAINT "smn_member_pkey" PRIMARY KEY ("id");


--
-- Name: smn_national_calendar_coverage smn_national_calendar_coverage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_national_calendar_coverage"
    ADD CONSTRAINT "smn_national_calendar_coverage_pkey" PRIMARY KEY ("country_code", "calendar_year");


--
-- Name: smn_national_calendar_validation_audit smn_national_calendar_validation_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_national_calendar_validation_audit"
    ADD CONSTRAINT "smn_national_calendar_validation_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_national_holiday_audit smn_national_holiday_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_national_holiday_audit"
    ADD CONSTRAINT "smn_national_holiday_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_national_holiday_manual_audit smn_national_holiday_manual_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_national_holiday_manual_audit"
    ADD CONSTRAINT "smn_national_holiday_manual_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_national_holiday smn_national_holiday_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_national_holiday"
    ADD CONSTRAINT "smn_national_holiday_pkey" PRIMARY KEY ("country_code", "holiday_date");


--
-- Name: smn_product smn_product_id_installation_pair_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_product"
    ADD CONSTRAINT "smn_product_id_installation_pair_key" UNIQUE ("id", "installation_id");


--
-- Name: smn_product smn_product_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_product"
    ADD CONSTRAINT "smn_product_pkey" PRIMARY KEY ("id");


--
-- Name: smn_recovery_phrase smn_recovery_phrase_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_recovery_phrase"
    ADD CONSTRAINT "smn_recovery_phrase_pkey" PRIMARY KEY ("account_id");


--
-- Name: smn_registry_comment smn_registry_comment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_registry_comment"
    ADD CONSTRAINT "smn_registry_comment_pkey" PRIMARY KEY ("id");


--
-- Name: smn_registry_comment_revision smn_registry_comment_revision_comment_id_revision_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_registry_comment_revision"
    ADD CONSTRAINT "smn_registry_comment_revision_comment_id_revision_key" UNIQUE ("comment_id", "revision");


--
-- Name: smn_registry_comment_revision smn_registry_comment_revision_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_registry_comment_revision"
    ADD CONSTRAINT "smn_registry_comment_revision_pkey" PRIMARY KEY ("id");


--
-- Name: smn_registry_cycle_link_audit smn_registry_cycle_link_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_registry_cycle_link_audit"
    ADD CONSTRAINT "smn_registry_cycle_link_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_registry_cycle_link smn_registry_cycle_link_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_registry_cycle_link"
    ADD CONSTRAINT "smn_registry_cycle_link_pkey" PRIMARY KEY ("item_id", "sprint_id");


--
-- Name: smn_registry_deadline_settings smn_registry_deadline_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_registry_deadline_settings"
    ADD CONSTRAINT "smn_registry_deadline_settings_pkey" PRIMARY KEY ("id");


--
-- Name: smn_registry_item_audit smn_registry_item_audit_item_id_revision_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_registry_item_audit"
    ADD CONSTRAINT "smn_registry_item_audit_item_id_revision_key" UNIQUE ("item_id", "revision");


--
-- Name: smn_registry_item_audit smn_registry_item_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_registry_item_audit"
    ADD CONSTRAINT "smn_registry_item_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_registry_item smn_registry_item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_registry_item"
    ADD CONSTRAINT "smn_registry_item_pkey" PRIMARY KEY ("id");


--
-- Name: smn_registry_linked_request smn_registry_linked_request_new_item_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_registry_linked_request"
    ADD CONSTRAINT "smn_registry_linked_request_new_item_id_key" UNIQUE ("new_item_id");


--
-- Name: smn_registry_linked_request smn_registry_linked_request_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_registry_linked_request"
    ADD CONSTRAINT "smn_registry_linked_request_pkey" PRIMARY KEY ("request_id");


--
-- Name: smn_registry_relation_audit smn_registry_relation_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_registry_relation_audit"
    ADD CONSTRAINT "smn_registry_relation_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_registry_relation smn_registry_relation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_registry_relation"
    ADD CONSTRAINT "smn_registry_relation_pkey" PRIMARY KEY ("id");


--
-- Name: smn_registry_relation smn_registry_relation_source_id_target_kind_target_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_registry_relation"
    ADD CONSTRAINT "smn_registry_relation_source_id_target_kind_target_id_key" UNIQUE ("source_id", "target_kind", "target_id");


--
-- Name: smn_report_analysis_choice smn_report_analysis_choice_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_analysis_choice"
    ADD CONSTRAINT "smn_report_analysis_choice_pkey" PRIMARY KEY ("sprint_id");


--
-- Name: smn_report_archive_grant smn_report_archive_grant_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_archive_grant"
    ADD CONSTRAINT "smn_report_archive_grant_pkey" PRIMARY KEY ("archive_id", "user_id");


--
-- Name: smn_report_archive_visibility smn_report_archive_visibility_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_archive_visibility"
    ADD CONSTRAINT "smn_report_archive_visibility_pkey" PRIMARY KEY ("archive_id");


--
-- Name: smn_report_content_options_audit smn_report_content_options_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_content_options_audit"
    ADD CONSTRAINT "smn_report_content_options_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_report_content_options smn_report_content_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_content_options"
    ADD CONSTRAINT "smn_report_content_options_pkey" PRIMARY KEY ("sprint_id");


--
-- Name: smn_report_document smn_report_document_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_document"
    ADD CONSTRAINT "smn_report_document_pkey" PRIMARY KEY ("id");


--
-- Name: smn_report_document_session_write smn_report_document_session_write_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_document_session_write"
    ADD CONSTRAINT "smn_report_document_session_write_pkey" PRIMARY KEY ("document_id", "session_id");


--
-- Name: smn_report_draft_audit smn_report_draft_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_draft_audit"
    ADD CONSTRAINT "smn_report_draft_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_report_draft smn_report_draft_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_draft"
    ADD CONSTRAINT "smn_report_draft_pkey" PRIMARY KEY ("sprint_id");


--
-- Name: smn_report_history_options smn_report_history_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_history_options"
    ADD CONSTRAINT "smn_report_history_options_pkey" PRIMARY KEY ("sprint_id");


--
-- Name: smn_report_language smn_report_language_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_language"
    ADD CONSTRAINT "smn_report_language_pkey" PRIMARY KEY ("sprint_id");


--
-- Name: smn_report_link_selection smn_report_link_selection_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_link_selection"
    ADD CONSTRAINT "smn_report_link_selection_pkey" PRIMARY KEY ("sprint_id");


--
-- Name: smn_report_logo smn_report_logo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_logo"
    ADD CONSTRAINT "smn_report_logo_pkey" PRIMARY KEY ("sprint_id");


--
-- Name: smn_report_pdf_archive smn_report_pdf_archive_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_pdf_archive"
    ADD CONSTRAINT "smn_report_pdf_archive_pkey" PRIMARY KEY ("id");


--
-- Name: smn_report_pdf_archive smn_report_pdf_archive_stored_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_pdf_archive"
    ADD CONSTRAINT "smn_report_pdf_archive_stored_name_key" UNIQUE ("stored_name");


--
-- Name: smn_report_render_reference smn_report_render_reference_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_render_reference"
    ADD CONSTRAINT "smn_report_render_reference_pkey" PRIMARY KEY ("id");


--
-- Name: smn_report_section_options_audit smn_report_section_options_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_section_options_audit"
    ADD CONSTRAINT "smn_report_section_options_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_report_section_options smn_report_section_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_section_options"
    ADD CONSTRAINT "smn_report_section_options_pkey" PRIMARY KEY ("sprint_id");


--
-- Name: smn_report_studio_archive_snapshot smn_report_studio_archive_snapshot_document_id_version_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_studio_archive_snapshot"
    ADD CONSTRAINT "smn_report_studio_archive_snapshot_document_id_version_key" UNIQUE ("document_id", "version");


--
-- Name: smn_report_studio_archive_snapshot smn_report_studio_archive_snapshot_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_studio_archive_snapshot"
    ADD CONSTRAINT "smn_report_studio_archive_snapshot_pkey" PRIMARY KEY ("archive_id");


--
-- Name: smn_report_team_context_options smn_report_team_context_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_team_context_options"
    ADD CONSTRAINT "smn_report_team_context_options_pkey" PRIMARY KEY ("sprint_id");


--
-- Name: smn_report_template smn_report_template_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_template"
    ADD CONSTRAINT "smn_report_template_pkey" PRIMARY KEY ("id");


--
-- Name: smn_risk_assessment_audit smn_risk_assessment_audit_item_id_revision_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_risk_assessment_audit"
    ADD CONSTRAINT "smn_risk_assessment_audit_item_id_revision_key" UNIQUE ("item_id", "revision");


--
-- Name: smn_risk_assessment_audit smn_risk_assessment_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_risk_assessment_audit"
    ADD CONSTRAINT "smn_risk_assessment_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_risk_assessment smn_risk_assessment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_risk_assessment"
    ADD CONSTRAINT "smn_risk_assessment_pkey" PRIMARY KEY ("item_id");


--
-- Name: smn_risk_roam_audit smn_risk_roam_audit_item_id_revision_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_risk_roam_audit"
    ADD CONSTRAINT "smn_risk_roam_audit_item_id_revision_key" UNIQUE ("item_id", "revision");


--
-- Name: smn_risk_roam_audit smn_risk_roam_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_risk_roam_audit"
    ADD CONSTRAINT "smn_risk_roam_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_risk_roam smn_risk_roam_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_risk_roam"
    ADD CONSTRAINT "smn_risk_roam_pkey" PRIMARY KEY ("item_id");


--
-- Name: smn_scrum_cadence_audit smn_scrum_cadence_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_scrum_cadence_audit"
    ADD CONSTRAINT "smn_scrum_cadence_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_scrum_cadence_audit smn_scrum_cadence_audit_team_id_revision_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_scrum_cadence_audit"
    ADD CONSTRAINT "smn_scrum_cadence_audit_team_id_revision_key" UNIQUE ("team_id", "revision");


--
-- Name: smn_scrum_cadence smn_scrum_cadence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_scrum_cadence"
    ADD CONSTRAINT "smn_scrum_cadence_pkey" PRIMARY KEY ("team_id");


--
-- Name: smn_scrum_ceremony_template_history smn_scrum_ceremony_template_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_scrum_ceremony_template_history"
    ADD CONSTRAINT "smn_scrum_ceremony_template_history_pkey" PRIMARY KEY ("id");


--
-- Name: smn_scrum_ceremony_template_history smn_scrum_ceremony_template_history_template_id_revision_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_scrum_ceremony_template_history"
    ADD CONSTRAINT "smn_scrum_ceremony_template_history_template_id_revision_key" UNIQUE ("template_id", "revision");


--
-- Name: smn_scrum_ceremony_template smn_scrum_ceremony_template_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_scrum_ceremony_template"
    ADD CONSTRAINT "smn_scrum_ceremony_template_pkey" PRIMARY KEY ("id");


--
-- Name: smn_scrum_lunch smn_scrum_lunch_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_scrum_lunch"
    ADD CONSTRAINT "smn_scrum_lunch_pkey" PRIMARY KEY ("team_id");


--
-- Name: smn_scrum_template_occurrence smn_scrum_template_occurrence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_scrum_template_occurrence"
    ADD CONSTRAINT "smn_scrum_template_occurrence_pkey" PRIMARY KEY ("id");


--
-- Name: smn_scrum_template_occurrence_status_history smn_scrum_template_occurrence_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_scrum_template_occurrence_status_history"
    ADD CONSTRAINT "smn_scrum_template_occurrence_status_history_pkey" PRIMARY KEY ("id");


--
-- Name: smn_scrum_template_occurrence smn_scrum_template_occurrence_template_id_sprint_id_starts__key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_scrum_template_occurrence"
    ADD CONSTRAINT "smn_scrum_template_occurrence_template_id_sprint_id_starts__key" UNIQUE ("template_id", "sprint_id", "starts_at");


--
-- Name: smn_sprint_audit smn_sprint_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_audit"
    ADD CONSTRAINT "smn_sprint_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_sprint_batch_audit smn_sprint_batch_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_batch_audit"
    ADD CONSTRAINT "smn_sprint_batch_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_sprint_batch_preview smn_sprint_batch_preview_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_batch_preview"
    ADD CONSTRAINT "smn_sprint_batch_preview_pkey" PRIMARY KEY ("token");


--
-- Name: smn_sprint_capacity_kpi_audit smn_sprint_capacity_kpi_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_capacity_kpi_audit"
    ADD CONSTRAINT "smn_sprint_capacity_kpi_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_sprint_capacity_kpi smn_sprint_capacity_kpi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_capacity_kpi"
    ADD CONSTRAINT "smn_sprint_capacity_kpi_pkey" PRIMARY KEY ("sprint_id");


--
-- Name: smn_sprint_capacity_trigger smn_sprint_capacity_trigger_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_capacity_trigger"
    ADD CONSTRAINT "smn_sprint_capacity_trigger_pkey" PRIMARY KEY ("sprint_id");


--
-- Name: smn_sprint_ceremony_history smn_sprint_ceremony_history_ceremony_id_revision_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_ceremony_history"
    ADD CONSTRAINT "smn_sprint_ceremony_history_ceremony_id_revision_key" UNIQUE ("ceremony_id", "revision");


--
-- Name: smn_sprint_ceremony_history smn_sprint_ceremony_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_ceremony_history"
    ADD CONSTRAINT "smn_sprint_ceremony_history_pkey" PRIMARY KEY ("id");


--
-- Name: smn_sprint_ceremony smn_sprint_ceremony_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_ceremony"
    ADD CONSTRAINT "smn_sprint_ceremony_pkey" PRIMARY KEY ("id");


--
-- Name: smn_sprint_ceremony_segment smn_sprint_ceremony_segment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_ceremony_segment"
    ADD CONSTRAINT "smn_sprint_ceremony_segment_pkey" PRIMARY KEY ("ceremony_id", "position");


--
-- Name: smn_sprint_ceremony smn_sprint_ceremony_sprint_id_kind_starts_at_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_ceremony"
    ADD CONSTRAINT "smn_sprint_ceremony_sprint_id_kind_starts_at_key" UNIQUE ("sprint_id", "kind", "starts_at");


--
-- Name: smn_sprint_ceremony_status_history smn_sprint_ceremony_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_ceremony_status_history"
    ADD CONSTRAINT "smn_sprint_ceremony_status_history_pkey" PRIMARY KEY ("id");


--
-- Name: smn_sprint_closure_audit smn_sprint_closure_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_closure_audit"
    ADD CONSTRAINT "smn_sprint_closure_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_sprint_closure_snapshot smn_sprint_closure_snapshot_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_closure_snapshot"
    ADD CONSTRAINT "smn_sprint_closure_snapshot_pkey" PRIMARY KEY ("id");


--
-- Name: smn_sprint_closure_snapshot smn_sprint_closure_snapshot_sprint_id_version_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_closure_snapshot"
    ADD CONSTRAINT "smn_sprint_closure_snapshot_sprint_id_version_key" UNIQUE ("sprint_id", "version");


--
-- Name: smn_sprint_exceptional_meeting_history smn_sprint_exceptional_meeting_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_exceptional_meeting_history"
    ADD CONSTRAINT "smn_sprint_exceptional_meeting_history_pkey" PRIMARY KEY ("id");


--
-- Name: smn_sprint_exceptional_meeting smn_sprint_exceptional_meeting_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_exceptional_meeting"
    ADD CONSTRAINT "smn_sprint_exceptional_meeting_pkey" PRIMARY KEY ("id");


--
-- Name: smn_sprint_exceptional_meeting_status_history smn_sprint_exceptional_meeting_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_exceptional_meeting_status_history"
    ADD CONSTRAINT "smn_sprint_exceptional_meeting_status_history_pkey" PRIMARY KEY ("id");


--
-- Name: smn_sprint_goal_audit smn_sprint_goal_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_goal_audit"
    ADD CONSTRAINT "smn_sprint_goal_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_sprint_goal smn_sprint_goal_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_goal"
    ADD CONSTRAINT "smn_sprint_goal_pkey" PRIMARY KEY ("id");


--
-- Name: smn_sprint_historical_actual_capacity_audit smn_sprint_historical_actual_capacity_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_historical_actual_capacity_audit"
    ADD CONSTRAINT "smn_sprint_historical_actual_capacity_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_sprint_historical_actual_capacity smn_sprint_historical_actual_capacity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_historical_actual_capacity"
    ADD CONSTRAINT "smn_sprint_historical_actual_capacity_pkey" PRIMARY KEY ("sprint_id");


--
-- Name: smn_sprint_historical_capacity_audit smn_sprint_historical_capacity_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_historical_capacity_audit"
    ADD CONSTRAINT "smn_sprint_historical_capacity_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_sprint_historical_capacity smn_sprint_historical_capacity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_historical_capacity"
    ADD CONSTRAINT "smn_sprint_historical_capacity_pkey" PRIMARY KEY ("sprint_id");


--
-- Name: smn_sprint_historical_event smn_sprint_historical_event_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_historical_event"
    ADD CONSTRAINT "smn_sprint_historical_event_pkey" PRIMARY KEY ("meeting_id");


--
-- Name: smn_sprint_historical_goal_detail smn_sprint_historical_goal_detail_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_historical_goal_detail"
    ADD CONSTRAINT "smn_sprint_historical_goal_detail_pkey" PRIMARY KEY ("goal_id");


--
-- Name: smn_sprint_historical_request smn_sprint_historical_request_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_historical_request"
    ADD CONSTRAINT "smn_sprint_historical_request_pkey" PRIMARY KEY ("operation_id");


--
-- Name: smn_sprint smn_sprint_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint"
    ADD CONSTRAINT "smn_sprint_pkey" PRIMARY KEY ("id");


--
-- Name: smn_sprint_reschedule_audit smn_sprint_reschedule_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_reschedule_audit"
    ADD CONSTRAINT "smn_sprint_reschedule_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_sprint_review_analysis_audit smn_sprint_review_analysis_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_review_analysis_audit"
    ADD CONSTRAINT "smn_sprint_review_analysis_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_sprint_review_analysis smn_sprint_review_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_review_analysis"
    ADD CONSTRAINT "smn_sprint_review_analysis_pkey" PRIMARY KEY ("sprint_id", "kind");


--
-- Name: smn_sprint_scores_audit smn_sprint_scores_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_scores_audit"
    ADD CONSTRAINT "smn_sprint_scores_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_sprint_scores smn_sprint_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_scores"
    ADD CONSTRAINT "smn_sprint_scores_pkey" PRIMARY KEY ("sprint_id");


--
-- Name: smn_sprint_story_points_audit smn_sprint_story_points_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_story_points_audit"
    ADD CONSTRAINT "smn_sprint_story_points_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_sprint_story_points smn_sprint_story_points_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_story_points"
    ADD CONSTRAINT "smn_sprint_story_points_pkey" PRIMARY KEY ("sprint_id");


--
-- Name: smn_sprint smn_sprint_team_id_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint"
    ADD CONSTRAINT "smn_sprint_team_id_number_key" UNIQUE ("team_id", "number");


--
-- Name: smn_sprint_ticket_counts_audit smn_sprint_ticket_counts_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_ticket_counts_audit"
    ADD CONSTRAINT "smn_sprint_ticket_counts_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_sprint_ticket_counts smn_sprint_ticket_counts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_ticket_counts"
    ADD CONSTRAINT "smn_sprint_ticket_counts_pkey" PRIMARY KEY ("sprint_id");


--
-- Name: smn_sprint_transition smn_sprint_transition_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_transition"
    ADD CONSTRAINT "smn_sprint_transition_pkey" PRIMARY KEY ("id");


--
-- Name: smn_sprint_transition smn_sprint_transition_sprint_id_transition_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_transition"
    ADD CONSTRAINT "smn_sprint_transition_sprint_id_transition_key" UNIQUE ("sprint_id", "transition");


--
-- Name: smn_sprint_wizard_preview smn_sprint_wizard_preview_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_wizard_preview"
    ADD CONSTRAINT "smn_sprint_wizard_preview_pkey" PRIMARY KEY ("token");


--
-- Name: smn_team_context_audit smn_team_context_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_team_context_audit"
    ADD CONSTRAINT "smn_team_context_audit_pkey" PRIMARY KEY ("id");


--
-- Name: smn_team_context_audit smn_team_context_audit_team_id_revision_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_team_context_audit"
    ADD CONSTRAINT "smn_team_context_audit_team_id_revision_key" UNIQUE ("team_id", "revision");


--
-- Name: smn_team_context smn_team_context_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_team_context"
    ADD CONSTRAINT "smn_team_context_pkey" PRIMARY KEY ("team_id");


--
-- Name: smn_team smn_team_installation_pair_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_team"
    ADD CONSTRAINT "smn_team_installation_pair_key" UNIQUE ("id", "installation_id");


--
-- Name: smn_team smn_team_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_team"
    ADD CONSTRAINT "smn_team_pkey" PRIMARY KEY ("id");


--
-- Name: smn_account_audit_recent_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "smn_account_audit_recent_idx" ON "public"."smn_account_audit" USING "btree" ("occurred_at" DESC, "id" DESC);


--
-- Name: smn_account_email_ci_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "smn_account_email_ci_key" ON "public"."smn_account" USING "btree" ("lower"("email"));


--
-- Name: smn_account_username_ci_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "smn_account_username_ci_key" ON "public"."smn_account" USING "btree" ("lower"("username"));


--
-- Name: smn_ai_brief_one_active_response; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "smn_ai_brief_one_active_response" ON "public"."smn_ai_brief_response" USING "btree" ("archive_id") WHERE ("deleted_at" IS NULL);


--
-- Name: smn_backup_retention_audit_recent_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "smn_backup_retention_audit_recent_idx" ON "public"."smn_backup_retention_audit" USING "btree" ("occurred_at" DESC, "id" DESC);


--
-- Name: smn_calendar_meeting_outcome_by_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "smn_calendar_meeting_outcome_by_event" ON "public"."smn_calendar_meeting_outcome_link" USING "btree" ("meeting_kind", "meeting_id", "created_at");


--
-- Name: smn_capacity_initial_opened_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "smn_capacity_initial_opened_idx" ON "public"."smn_capacity_initial_snapshot" USING "btree" ("actual_opened_at");


--
-- Name: smn_capacity_period_history_lookup_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "smn_capacity_period_history_lookup_idx" ON "public"."smn_capacity_period_override_history" USING "btree" ("period_id", "changed_at");


--
-- Name: smn_capacity_period_override_team_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "smn_capacity_period_override_team_idx" ON "public"."smn_capacity_period_override" USING "btree" ("team_id", "start_on", "end_on");


--
-- Name: smn_closure_company_period_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "smn_closure_company_period_idx" ON "public"."smn_company_closure" USING "btree" ("company_id", "start_on", "end_on") WHERE ("is_active" = true);


--
-- Name: smn_company_capacity_recalc_due_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "smn_company_capacity_recalc_due_idx" ON "public"."smn_company_capacity_recalc" USING "btree" ("status", "next_attempt_at");


--
-- Name: smn_company_closure_history_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "smn_company_closure_history_idx" ON "public"."smn_company_closure_history" USING "btree" ("closure_id", "changed_at");


--
-- Name: smn_company_installation_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "smn_company_installation_active_idx" ON "public"."smn_company" USING "btree" ("installation_id", "archived_at");


--
-- Name: smn_company_installation_name_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "smn_company_installation_name_uq" ON "public"."smn_company" USING "btree" ("installation_id", "lower"("btrim"(("name")::"text")));


--
-- Name: smn_country_lifecycle_audit_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "smn_country_lifecycle_audit_country_idx" ON "public"."smn_country_lifecycle_audit" USING "btree" ("country_code", "occurred_at");


--
-- Name: smn_kanban_period_team_dates_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "smn_kanban_period_team_dates_idx" ON "public"."smn_kanban_period" USING "btree" ("team_id", "start_on", "end_on");


--
-- Name: smn_link_audit_link_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "smn_link_audit_link_idx" ON "public"."smn_link_audit" USING "btree" ("link_id", "occurred_at");


--
-- Name: smn_link_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "smn_link_category_idx" ON "public"."smn_link" USING "btree" ("category_id");


--
-- Name: smn_link_category_name_ci_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "smn_link_category_name_ci_key" ON "public"."smn_link_category" USING "btree" ("installation_id", "lower"("btrim"("name")));


--
-- Name: smn_link_installation_scope_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "smn_link_installation_scope_idx" ON "public"."smn_link" USING "btree" ("installation_id", "scope", "team_id");


--
-- Name: smn_member_absence_dates_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "smn_member_absence_dates_idx" ON "public"."smn_member_absence" USING "btree" ("member_id", "start_on", "end_on");


--
-- Name: smn_member_absence_history_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "smn_member_absence_history_date_idx" ON "public"."smn_member_absence_history" USING "btree" ("absence_id", "changed_at");


--
-- Name: smn_member_assignment_one_initial_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "smn_member_assignment_one_initial_idx" ON "public"."smn_member_assignment" USING "btree" ("member_id") WHERE ("end_on" IS NULL);


--
-- Name: smn_member_assignment_team_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "smn_member_assignment_team_idx" ON "public"."smn_member_assignment" USING "btree" ("team_id", "start_on", "member_id");


--
-- Name: smn_member_assignment_version_effective_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "smn_member_assignment_version_effective_idx" ON "public"."smn_member_assignment_version" USING "btree" ("assignment_id", "effective_from" DESC, "revision" DESC);


--
-- Name: smn_member_calendar_exception_day_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "smn_member_calendar_exception_day_idx" ON "public"."smn_member_calendar_exception" USING "btree" ("member_id", "on_date", "revision" DESC);


--
-- Name: smn_member_calendar_week_effective_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "smn_member_calendar_week_effective_idx" ON "public"."smn_member_calendar_week" USING "btree" ("member_id", "effective_from" DESC, "revision" DESC);


--
-- Name: smn_member_company_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "smn_member_company_idx" ON "public"."smn_member" USING "btree" ("company_id") WHERE ("company_id" IS NOT NULL);


--
-- Name: smn_member_identity_history_member_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "smn_member_identity_history_member_idx" ON "public"."smn_member_identity_history" USING "btree" ("member_id", "changed_at" DESC);


--
-- Name: smn_member_lifecycle_event_member_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "smn_member_lifecycle_event_member_idx" ON "public"."smn_member_lifecycle_event" USING "btree" ("member_id", "occurred_at" DESC);


--
-- Name: smn_member_location_effective_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "smn_member_location_effective_idx" ON "public"."smn_member_location" USING "btree" ("member_id", "effective_from" DESC, "revision" DESC);


--
-- Name: smn_national_calendar_validation_audit_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "smn_national_calendar_validation_audit_idx" ON "public"."smn_national_calendar_validation_audit" USING "btree" ("country_code", "calendar_year", "occurred_at");


--
-- Name: smn_national_holiday_audit_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "smn_national_holiday_audit_date_idx" ON "public"."smn_national_holiday_audit" USING "btree" ("country_code", "holiday_date", "occurred_at");


--
-- Name: smn_national_holiday_manual_audit_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "smn_national_holiday_manual_audit_country_idx" ON "public"."smn_national_holiday_manual_audit" USING "btree" ("country_code", "occurred_at");


--
-- Name: smn_pdf_archive_operation_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "smn_pdf_archive_operation_uq" ON "public"."smn_report_pdf_archive" USING "btree" ("operation_id") WHERE ("operation_id" IS NOT NULL);


--
-- Name: smn_registry_comment_item_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "smn_registry_comment_item_date" ON "public"."smn_registry_comment" USING "btree" ("item_id", "created_at" DESC, "id" DESC);


--
-- Name: smn_registry_item_team_type_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "smn_registry_item_team_type_date" ON "public"."smn_registry_item" USING "btree" ("team_id", "type", "occurred_on" DESC, "id");


--
-- Name: smn_report_document_create_request_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "smn_report_document_create_request_idx" ON "public"."smn_report_document" USING "btree" ("creation_request_id") WHERE ("creation_request_id" IS NOT NULL);


--
-- Name: smn_report_document_sprint_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "smn_report_document_sprint_idx" ON "public"."smn_report_document" USING "btree" ("sprint_id", "updated_at" DESC);


--
-- Name: smn_team_installation_name_ci_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "smn_team_installation_name_ci_key" ON "public"."smn_team" USING "btree" ("installation_id", "lower"("btrim"("regexp_replace"("name", '[[:space:]]+'::"text", ' '::"text", 'g'::"text"))));


--
-- Name: smn_team_product_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "smn_team_product_id_key" ON "public"."smn_team" USING "btree" ("product_id");


--
-- Name: smn_capacity_actual_snapshot smn_actual_snapshot_immutable_write; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "smn_actual_snapshot_immutable_write" BEFORE DELETE OR UPDATE ON "public"."smn_capacity_actual_snapshot" FOR EACH ROW EXECUTE FUNCTION "public"."smn_actual_snapshot_immutable"();


--
-- Name: smn_ai_brief_archive smn_ai_brief_immutable; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "smn_ai_brief_immutable" BEFORE DELETE OR UPDATE ON "public"."smn_ai_brief_archive" FOR EACH ROW EXECUTE FUNCTION "public"."smn_ai_brief_archive_immutable"();


--
-- Name: smn_capacity_historical_quality_history smn_historical_quality_history_guard; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "smn_historical_quality_history_guard" BEFORE DELETE OR UPDATE ON "public"."smn_capacity_historical_quality_history" FOR EACH ROW EXECUTE FUNCTION "public"."smn_historical_quality_history_immutable"();


--
-- Name: smn_capacity_initial_snapshot smn_initial_snapshot_immutable_write; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "smn_initial_snapshot_immutable_write" BEFORE DELETE OR UPDATE ON "public"."smn_capacity_initial_snapshot" FOR EACH ROW EXECUTE FUNCTION "public"."smn_initial_snapshot_immutable"();


--
-- Name: smn_capacity_replanning_history smn_replanning_history_immutable_guard; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "smn_replanning_history_immutable_guard" BEFORE DELETE OR UPDATE ON "public"."smn_capacity_replanning_history" FOR EACH ROW EXECUTE FUNCTION "public"."smn_replanning_history_immutable"();


--
-- Name: smn_report_studio_archive_snapshot smn_studio_archive_immutable; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "smn_studio_archive_immutable" BEFORE DELETE OR UPDATE ON "public"."smn_report_studio_archive_snapshot" FOR EACH ROW EXECUTE FUNCTION "public"."smn_reject_studio_archive_snapshot_mutation"();


--
-- Name: smn_account_audit smn_account_audit_installation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_account_audit"
    ADD CONSTRAINT "smn_account_audit_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "public"."smn_installation"("id");


--
-- Name: smn_account smn_account_installation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_account"
    ADD CONSTRAINT "smn_account_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "public"."smn_installation"("id");


--
-- Name: smn_action_link smn_action_link_action_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_action_link"
    ADD CONSTRAINT "smn_action_link_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "public"."smn_registry_item"("id") ON DELETE RESTRICT;


--
-- Name: smn_action_link_audit smn_action_link_audit_action_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_action_link_audit"
    ADD CONSTRAINT "smn_action_link_audit_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "public"."smn_registry_item"("id") ON DELETE RESTRICT;


--
-- Name: smn_action_link_audit smn_action_link_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_action_link_audit"
    ADD CONSTRAINT "smn_action_link_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_action_link smn_action_link_related_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_action_link"
    ADD CONSTRAINT "smn_action_link_related_id_fkey" FOREIGN KEY ("related_id") REFERENCES "public"."smn_registry_item"("id") ON DELETE RESTRICT;


--
-- Name: smn_ai_brief_response smn_ai_brief_response_archive_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_ai_brief_response"
    ADD CONSTRAINT "smn_ai_brief_response_archive_id_fkey" FOREIGN KEY ("archive_id") REFERENCES "public"."smn_ai_brief_archive"("id") ON DELETE RESTRICT;


--
-- Name: smn_auth_audit smn_auth_audit_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_auth_audit"
    ADD CONSTRAINT "smn_auth_audit_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."smn_account"("id") ON DELETE CASCADE;


--
-- Name: smn_automatic_highlight smn_automatic_highlight_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_automatic_highlight"
    ADD CONSTRAINT "smn_automatic_highlight_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_automatic_highlight smn_automatic_highlight_invalidated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_automatic_highlight"
    ADD CONSTRAINT "smn_automatic_highlight_invalidated_by_fkey" FOREIGN KEY ("invalidated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_automatic_highlight_settings smn_automatic_highlight_settings_installation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_automatic_highlight_settings"
    ADD CONSTRAINT "smn_automatic_highlight_settings_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "public"."smn_installation"("id");


--
-- Name: smn_automatic_highlight_settings smn_automatic_highlight_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_automatic_highlight_settings"
    ADD CONSTRAINT "smn_automatic_highlight_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_backup_retention_audit smn_backup_retention_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_backup_retention_audit"
    ADD CONSTRAINT "smn_backup_retention_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_backup_retention_audit smn_backup_retention_audit_installation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_backup_retention_audit"
    ADD CONSTRAINT "smn_backup_retention_audit_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "public"."smn_installation"("id");


--
-- Name: smn_backup_retention smn_backup_retention_installation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_backup_retention"
    ADD CONSTRAINT "smn_backup_retention_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "public"."smn_installation"("id");


--
-- Name: smn_backup_retention smn_backup_retention_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_backup_retention"
    ADD CONSTRAINT "smn_backup_retention_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_calendar_meeting_outcome_link smn_calendar_meeting_outcome_link_registry_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_calendar_meeting_outcome_link"
    ADD CONSTRAINT "smn_calendar_meeting_outcome_link_registry_item_id_fkey" FOREIGN KEY ("registry_item_id") REFERENCES "public"."smn_registry_item"("id") ON DELETE RESTRICT;


--
-- Name: smn_calendar_meeting_outcome_link smn_calendar_meeting_outcome_link_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_calendar_meeting_outcome_link"
    ADD CONSTRAINT "smn_calendar_meeting_outcome_link_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_calendar_meeting_outcome_link smn_calendar_meeting_outcome_link_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_calendar_meeting_outcome_link"
    ADD CONSTRAINT "smn_calendar_meeting_outcome_link_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."smn_team"("id") ON DELETE RESTRICT;


--
-- Name: smn_calendar_meeting_schedule_history smn_calendar_meeting_schedule_history_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_calendar_meeting_schedule_history"
    ADD CONSTRAINT "smn_calendar_meeting_schedule_history_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_capacity_actual_override_history smn_capacity_actual_override_history_actual_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_actual_override_history"
    ADD CONSTRAINT "smn_capacity_actual_override_history_actual_id_fkey" FOREIGN KEY ("actual_id") REFERENCES "public"."smn_capacity_actual_override"("id") ON DELETE RESTRICT;


--
-- Name: smn_capacity_actual_override_history smn_capacity_actual_override_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_actual_override_history"
    ADD CONSTRAINT "smn_capacity_actual_override_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_capacity_actual_override smn_capacity_actual_override_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_actual_override"
    ADD CONSTRAINT "smn_capacity_actual_override_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "public"."smn_capacity_period_override"("id") ON DELETE RESTRICT;


--
-- Name: smn_capacity_actual_override smn_capacity_actual_override_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_actual_override"
    ADD CONSTRAINT "smn_capacity_actual_override_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_capacity_actual_snapshot smn_capacity_actual_snapshot_closed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_actual_snapshot"
    ADD CONSTRAINT "smn_capacity_actual_snapshot_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_capacity_actual_snapshot smn_capacity_actual_snapshot_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_actual_snapshot"
    ADD CONSTRAINT "smn_capacity_actual_snapshot_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "public"."smn_capacity_period_override"("id") ON DELETE RESTRICT;


--
-- Name: smn_capacity_historical_quality_history smn_capacity_historical_quality_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_historical_quality_history"
    ADD CONSTRAINT "smn_capacity_historical_quality_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_capacity_historical_quality_history smn_capacity_historical_quality_history_qualification_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_historical_quality_history"
    ADD CONSTRAINT "smn_capacity_historical_quality_history_qualification_id_fkey" FOREIGN KEY ("qualification_id") REFERENCES "public"."smn_capacity_historical_quality"("id") ON DELETE RESTRICT;


--
-- Name: smn_capacity_historical_quality smn_capacity_historical_quality_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_historical_quality"
    ADD CONSTRAINT "smn_capacity_historical_quality_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."smn_team"("id") ON DELETE RESTRICT;


--
-- Name: smn_capacity_historical_quality smn_capacity_historical_quality_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_historical_quality"
    ADD CONSTRAINT "smn_capacity_historical_quality_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_capacity_initial_snapshot smn_capacity_initial_snapshot_opened_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_initial_snapshot"
    ADD CONSTRAINT "smn_capacity_initial_snapshot_opened_by_fkey" FOREIGN KEY ("opened_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_capacity_initial_snapshot smn_capacity_initial_snapshot_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_initial_snapshot"
    ADD CONSTRAINT "smn_capacity_initial_snapshot_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "public"."smn_capacity_period_override"("id") ON DELETE RESTRICT;


--
-- Name: smn_capacity_period_override_history smn_capacity_period_override_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_period_override_history"
    ADD CONSTRAINT "smn_capacity_period_override_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_capacity_period_override_history smn_capacity_period_override_history_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_period_override_history"
    ADD CONSTRAINT "smn_capacity_period_override_history_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "public"."smn_capacity_period_override"("id") ON DELETE RESTRICT;


--
-- Name: smn_capacity_period_override smn_capacity_period_override_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_period_override"
    ADD CONSTRAINT "smn_capacity_period_override_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."smn_team"("id") ON DELETE RESTRICT;


--
-- Name: smn_capacity_period_override smn_capacity_period_override_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_period_override"
    ADD CONSTRAINT "smn_capacity_period_override_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_capacity_replanning smn_capacity_replanning_confirmed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_replanning"
    ADD CONSTRAINT "smn_capacity_replanning_confirmed_by_fkey" FOREIGN KEY ("confirmed_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_capacity_replanning_history smn_capacity_replanning_history_confirmed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_replanning_history"
    ADD CONSTRAINT "smn_capacity_replanning_history_confirmed_by_fkey" FOREIGN KEY ("confirmed_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_capacity_replanning_history smn_capacity_replanning_history_replanning_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_replanning_history"
    ADD CONSTRAINT "smn_capacity_replanning_history_replanning_id_fkey" FOREIGN KEY ("replanning_id") REFERENCES "public"."smn_capacity_replanning"("id") ON DELETE RESTRICT;


--
-- Name: smn_capacity_replanning smn_capacity_replanning_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_replanning"
    ADD CONSTRAINT "smn_capacity_replanning_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "public"."smn_capacity_period_override"("id") ON DELETE RESTRICT;


--
-- Name: smn_capacity_settings_audit smn_capacity_settings_audit_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_settings_audit"
    ADD CONSTRAINT "smn_capacity_settings_audit_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_capacity_settings_audit smn_capacity_settings_audit_installation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_settings_audit"
    ADD CONSTRAINT "smn_capacity_settings_audit_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "public"."smn_capacity_settings"("installation_id") ON DELETE RESTRICT;


--
-- Name: smn_capacity_settings smn_capacity_settings_installation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_settings"
    ADD CONSTRAINT "smn_capacity_settings_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "public"."smn_installation"("id") ON DELETE RESTRICT;


--
-- Name: smn_capacity_settings smn_capacity_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_capacity_settings"
    ADD CONSTRAINT "smn_capacity_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_company_closure smn_closure_company_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_company_closure"
    ADD CONSTRAINT "smn_closure_company_fk" FOREIGN KEY ("company_id") REFERENCES "public"."smn_company"("id") ON DELETE RESTRICT;


--
-- Name: smn_company_capacity_recalc smn_company_capacity_recalc_closure_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_company_capacity_recalc"
    ADD CONSTRAINT "smn_company_capacity_recalc_closure_id_fkey" FOREIGN KEY ("closure_id") REFERENCES "public"."smn_company_closure"("id") ON DELETE RESTRICT;


--
-- Name: smn_company_capacity_recalc smn_company_capacity_recalc_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_company_capacity_recalc"
    ADD CONSTRAINT "smn_company_capacity_recalc_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."smn_company"("id") ON DELETE RESTRICT;


--
-- Name: smn_company_closure smn_company_closure_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_company_closure"
    ADD CONSTRAINT "smn_company_closure_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_company_closure_history smn_company_closure_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_company_closure_history"
    ADD CONSTRAINT "smn_company_closure_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_company_closure_history smn_company_closure_history_closure_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_company_closure_history"
    ADD CONSTRAINT "smn_company_closure_history_closure_id_fkey" FOREIGN KEY ("closure_id") REFERENCES "public"."smn_company_closure"("id") ON DELETE RESTRICT;


--
-- Name: smn_company_closure smn_company_closure_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_company_closure"
    ADD CONSTRAINT "smn_company_closure_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_company smn_company_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_company"
    ADD CONSTRAINT "smn_company_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_company smn_company_installation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_company"
    ADD CONSTRAINT "smn_company_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "public"."smn_installation"("id") ON DELETE RESTRICT;


--
-- Name: smn_company smn_company_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_company"
    ADD CONSTRAINT "smn_company_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_configuration_task smn_configuration_task_installation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_configuration_task"
    ADD CONSTRAINT "smn_configuration_task_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "public"."smn_installation"("id");


--
-- Name: smn_configuration_task smn_configuration_task_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_configuration_task"
    ADD CONSTRAINT "smn_configuration_task_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_country smn_country_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_country"
    ADD CONSTRAINT "smn_country_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_country_lifecycle_audit smn_country_lifecycle_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_country_lifecycle_audit"
    ADD CONSTRAINT "smn_country_lifecycle_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_country_lifecycle_audit smn_country_lifecycle_audit_country_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_country_lifecycle_audit"
    ADD CONSTRAINT "smn_country_lifecycle_audit_country_code_fkey" FOREIGN KEY ("country_code") REFERENCES "public"."smn_country"("code") ON DELETE RESTRICT;


--
-- Name: smn_country_name_audit smn_country_name_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_country_name_audit"
    ADD CONSTRAINT "smn_country_name_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_country_name_audit smn_country_name_audit_country_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_country_name_audit"
    ADD CONSTRAINT "smn_country_name_audit_country_code_fkey" FOREIGN KEY ("country_code") REFERENCES "public"."smn_country"("code") ON DELETE RESTRICT;


--
-- Name: smn_dashboard_event_edit_audit smn_dashboard_event_edit_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_dashboard_event_edit_audit"
    ADD CONSTRAINT "smn_dashboard_event_edit_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_dashboard_note_audit smn_dashboard_note_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_dashboard_note_audit"
    ADD CONSTRAINT "smn_dashboard_note_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_dashboard_note_audit smn_dashboard_note_audit_note_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_dashboard_note_audit"
    ADD CONSTRAINT "smn_dashboard_note_audit_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "public"."smn_dashboard_note"("id");


--
-- Name: smn_dashboard_note smn_dashboard_note_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_dashboard_note"
    ADD CONSTRAINT "smn_dashboard_note_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_dashboard_note_edit_audit smn_dashboard_note_edit_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_dashboard_note_edit_audit"
    ADD CONSTRAINT "smn_dashboard_note_edit_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_dashboard_note_edit_audit smn_dashboard_note_edit_audit_note_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_dashboard_note_edit_audit"
    ADD CONSTRAINT "smn_dashboard_note_edit_audit_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "public"."smn_dashboard_note"("id");


--
-- Name: smn_dashboard_note smn_dashboard_note_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_dashboard_note"
    ADD CONSTRAINT "smn_dashboard_note_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id");


--
-- Name: smn_dashboard_note smn_dashboard_note_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_dashboard_note"
    ADD CONSTRAINT "smn_dashboard_note_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."smn_team"("id");


--
-- Name: smn_decision_detail_audit smn_decision_detail_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_decision_detail_audit"
    ADD CONSTRAINT "smn_decision_detail_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_decision_detail_audit smn_decision_detail_audit_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_decision_detail_audit"
    ADD CONSTRAINT "smn_decision_detail_audit_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."smn_registry_item"("id") ON DELETE RESTRICT;


--
-- Name: smn_decision_detail smn_decision_detail_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_decision_detail"
    ADD CONSTRAINT "smn_decision_detail_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."smn_registry_item"("id") ON DELETE RESTRICT;


--
-- Name: smn_decision_detail smn_decision_detail_replaces_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_decision_detail"
    ADD CONSTRAINT "smn_decision_detail_replaces_id_fkey" FOREIGN KEY ("replaces_id") REFERENCES "public"."smn_registry_item"("id") ON DELETE RESTRICT;


--
-- Name: smn_decision_detail smn_decision_detail_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_decision_detail"
    ADD CONSTRAINT "smn_decision_detail_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_dependency_parties_audit smn_dependency_parties_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_dependency_parties_audit"
    ADD CONSTRAINT "smn_dependency_parties_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_dependency_parties_audit smn_dependency_parties_audit_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_dependency_parties_audit"
    ADD CONSTRAINT "smn_dependency_parties_audit_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."smn_registry_item"("id") ON DELETE RESTRICT;


--
-- Name: smn_dependency_parties smn_dependency_parties_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_dependency_parties"
    ADD CONSTRAINT "smn_dependency_parties_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."smn_registry_item"("id") ON DELETE RESTRICT;


--
-- Name: smn_dependency_parties smn_dependency_parties_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_dependency_parties"
    ADD CONSTRAINT "smn_dependency_parties_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_dependency_vigilance_audit smn_dependency_vigilance_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_dependency_vigilance_audit"
    ADD CONSTRAINT "smn_dependency_vigilance_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_dependency_vigilance_audit smn_dependency_vigilance_audit_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_dependency_vigilance_audit"
    ADD CONSTRAINT "smn_dependency_vigilance_audit_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."smn_registry_item"("id") ON DELETE RESTRICT;


--
-- Name: smn_dependency_vigilance smn_dependency_vigilance_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_dependency_vigilance"
    ADD CONSTRAINT "smn_dependency_vigilance_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."smn_registry_item"("id") ON DELETE RESTRICT;


--
-- Name: smn_dependency_vigilance smn_dependency_vigilance_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_dependency_vigilance"
    ADD CONSTRAINT "smn_dependency_vigilance_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_exceptional_capacity_impact_history smn_exceptional_capacity_impact_history_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_exceptional_capacity_impact_history"
    ADD CONSTRAINT "smn_exceptional_capacity_impact_history_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_exceptional_capacity_impact_history smn_exceptional_capacity_impact_history_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_exceptional_capacity_impact_history"
    ADD CONSTRAINT "smn_exceptional_capacity_impact_history_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."smn_sprint_exceptional_meeting"("id") ON DELETE RESTRICT;


--
-- Name: smn_exceptional_meeting_participant_audit smn_exceptional_meeting_participant_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_exceptional_meeting_participant_audit"
    ADD CONSTRAINT "smn_exceptional_meeting_participant_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_exceptional_meeting_participant_audit smn_exceptional_meeting_participant_audit_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_exceptional_meeting_participant_audit"
    ADD CONSTRAINT "smn_exceptional_meeting_participant_audit_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."smn_sprint_exceptional_meeting"("id") ON DELETE RESTRICT;


--
-- Name: smn_exceptional_meeting_participant smn_exceptional_meeting_participant_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_exceptional_meeting_participant"
    ADD CONSTRAINT "smn_exceptional_meeting_participant_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."smn_sprint_exceptional_meeting"("id") ON DELETE RESTRICT;


--
-- Name: smn_exceptional_meeting_participant smn_exceptional_meeting_participant_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_exceptional_meeting_participant"
    ADD CONSTRAINT "smn_exceptional_meeting_participant_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."smn_member"("id") ON DELETE RESTRICT;


--
-- Name: smn_fact_selection_audit smn_fact_selection_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_fact_selection_audit"
    ADD CONSTRAINT "smn_fact_selection_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_fact_selection smn_fact_selection_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_fact_selection"
    ADD CONSTRAINT "smn_fact_selection_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_general_settings_audit smn_general_settings_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_general_settings_audit"
    ADD CONSTRAINT "smn_general_settings_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_general_settings_audit smn_general_settings_audit_installation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_general_settings_audit"
    ADD CONSTRAINT "smn_general_settings_audit_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "public"."smn_installation"("id");


--
-- Name: smn_general_settings smn_general_settings_installation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_general_settings"
    ADD CONSTRAINT "smn_general_settings_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "public"."smn_installation"("id");


--
-- Name: smn_general_settings smn_general_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_general_settings"
    ADD CONSTRAINT "smn_general_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_historical_csv_attempt smn_historical_csv_attempt_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_historical_csv_attempt"
    ADD CONSTRAINT "smn_historical_csv_attempt_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_historical_csv_batch smn_historical_csv_batch_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_historical_csv_batch"
    ADD CONSTRAINT "smn_historical_csv_batch_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_historical_csv_change smn_historical_csv_change_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_historical_csv_change"
    ADD CONSTRAINT "smn_historical_csv_change_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_historical_csv_change smn_historical_csv_change_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_historical_csv_change"
    ADD CONSTRAINT "smn_historical_csv_change_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."smn_historical_csv_batch"("id") ON DELETE RESTRICT;


--
-- Name: smn_kanban_batch_audit smn_kanban_batch_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_batch_audit"
    ADD CONSTRAINT "smn_kanban_batch_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_kanban_batch_audit smn_kanban_batch_audit_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_batch_audit"
    ADD CONSTRAINT "smn_kanban_batch_audit_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."smn_team"("id") ON DELETE RESTRICT;


--
-- Name: smn_kanban_cadence_audit smn_kanban_cadence_audit_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_cadence_audit"
    ADD CONSTRAINT "smn_kanban_cadence_audit_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_kanban_cadence_audit smn_kanban_cadence_audit_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_cadence_audit"
    ADD CONSTRAINT "smn_kanban_cadence_audit_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."smn_team"("id") ON DELETE RESTRICT;


--
-- Name: smn_kanban_cadence smn_kanban_cadence_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_cadence"
    ADD CONSTRAINT "smn_kanban_cadence_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."smn_team"("id") ON DELETE RESTRICT;


--
-- Name: smn_kanban_cadence smn_kanban_cadence_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_cadence"
    ADD CONSTRAINT "smn_kanban_cadence_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_kanban_capacity_opening smn_kanban_capacity_opening_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_capacity_opening"
    ADD CONSTRAINT "smn_kanban_capacity_opening_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "public"."smn_kanban_period"("id") ON DELETE RESTRICT;


--
-- Name: smn_kanban_closure smn_kanban_closure_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_closure"
    ADD CONSTRAINT "smn_kanban_closure_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_kanban_closure smn_kanban_closure_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_closure"
    ADD CONSTRAINT "smn_kanban_closure_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "public"."smn_kanban_period"("id") ON DELETE RESTRICT;


--
-- Name: smn_kanban_flow_audit smn_kanban_flow_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_flow_audit"
    ADD CONSTRAINT "smn_kanban_flow_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_kanban_flow_audit smn_kanban_flow_audit_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_flow_audit"
    ADD CONSTRAINT "smn_kanban_flow_audit_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "public"."smn_kanban_period"("id") ON DELETE RESTRICT;


--
-- Name: smn_kanban_flow_counts smn_kanban_flow_counts_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_flow_counts"
    ADD CONSTRAINT "smn_kanban_flow_counts_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "public"."smn_kanban_period"("id") ON DELETE RESTRICT;


--
-- Name: smn_kanban_flow_counts smn_kanban_flow_counts_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_flow_counts"
    ADD CONSTRAINT "smn_kanban_flow_counts_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_kanban_goal_audit smn_kanban_goal_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_goal_audit"
    ADD CONSTRAINT "smn_kanban_goal_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_kanban_goal_audit smn_kanban_goal_audit_goal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_goal_audit"
    ADD CONSTRAINT "smn_kanban_goal_audit_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "public"."smn_kanban_goal"("id") ON DELETE RESTRICT;


--
-- Name: smn_kanban_goal smn_kanban_goal_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_goal"
    ADD CONSTRAINT "smn_kanban_goal_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_kanban_goal smn_kanban_goal_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_goal"
    ADD CONSTRAINT "smn_kanban_goal_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "public"."smn_kanban_period"("id") ON DELETE RESTRICT;


--
-- Name: smn_kanban_meeting smn_kanban_meeting_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_meeting"
    ADD CONSTRAINT "smn_kanban_meeting_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_kanban_meeting smn_kanban_meeting_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_meeting"
    ADD CONSTRAINT "smn_kanban_meeting_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "public"."smn_kanban_period"("id") ON DELETE RESTRICT;


--
-- Name: smn_kanban_period_audit smn_kanban_period_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_period_audit"
    ADD CONSTRAINT "smn_kanban_period_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_kanban_period_audit smn_kanban_period_audit_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_period_audit"
    ADD CONSTRAINT "smn_kanban_period_audit_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "public"."smn_kanban_period"("id") ON DELETE RESTRICT;


--
-- Name: smn_kanban_period smn_kanban_period_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_period"
    ADD CONSTRAINT "smn_kanban_period_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_kanban_period smn_kanban_period_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_period"
    ADD CONSTRAINT "smn_kanban_period_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_kanban_period smn_kanban_period_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_period"
    ADD CONSTRAINT "smn_kanban_period_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."smn_team"("id") ON DELETE RESTRICT;


--
-- Name: smn_kanban_period_transition smn_kanban_period_transition_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_period_transition"
    ADD CONSTRAINT "smn_kanban_period_transition_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "public"."smn_kanban_period"("id") ON DELETE RESTRICT;


--
-- Name: smn_kanban_registry_link_audit smn_kanban_registry_link_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_registry_link_audit"
    ADD CONSTRAINT "smn_kanban_registry_link_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_kanban_registry_link_audit smn_kanban_registry_link_audit_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_registry_link_audit"
    ADD CONSTRAINT "smn_kanban_registry_link_audit_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."smn_registry_item"("id") ON DELETE RESTRICT;


--
-- Name: smn_kanban_registry_link_audit smn_kanban_registry_link_audit_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_registry_link_audit"
    ADD CONSTRAINT "smn_kanban_registry_link_audit_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "public"."smn_kanban_period"("id") ON DELETE RESTRICT;


--
-- Name: smn_kanban_registry_link smn_kanban_registry_link_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_registry_link"
    ADD CONSTRAINT "smn_kanban_registry_link_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."smn_registry_item"("id") ON DELETE RESTRICT;


--
-- Name: smn_kanban_registry_link smn_kanban_registry_link_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_registry_link"
    ADD CONSTRAINT "smn_kanban_registry_link_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "public"."smn_kanban_period"("id") ON DELETE RESTRICT;


--
-- Name: smn_kanban_render_reference smn_kanban_render_reference_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_render_reference"
    ADD CONSTRAINT "smn_kanban_render_reference_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "public"."smn_kanban_period"("id") ON DELETE RESTRICT;


--
-- Name: smn_kanban_timing_audit smn_kanban_timing_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_timing_audit"
    ADD CONSTRAINT "smn_kanban_timing_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_kanban_timing_audit smn_kanban_timing_audit_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_timing_audit"
    ADD CONSTRAINT "smn_kanban_timing_audit_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "public"."smn_kanban_period"("id") ON DELETE RESTRICT;


--
-- Name: smn_kanban_timing smn_kanban_timing_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_timing"
    ADD CONSTRAINT "smn_kanban_timing_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "public"."smn_kanban_period"("id") ON DELETE RESTRICT;


--
-- Name: smn_kanban_timing smn_kanban_timing_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_kanban_timing"
    ADD CONSTRAINT "smn_kanban_timing_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_link_audit smn_link_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_link_audit"
    ADD CONSTRAINT "smn_link_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_link_audit smn_link_audit_installation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_link_audit"
    ADD CONSTRAINT "smn_link_audit_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "public"."smn_installation"("id") ON DELETE RESTRICT;


--
-- Name: smn_link_category smn_link_category_installation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_link_category"
    ADD CONSTRAINT "smn_link_category_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "public"."smn_installation"("id") ON DELETE RESTRICT;


--
-- Name: smn_link smn_link_category_same_installation_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_link"
    ADD CONSTRAINT "smn_link_category_same_installation_fk" FOREIGN KEY ("category_id", "installation_id") REFERENCES "public"."smn_link_category"("id", "installation_id") ON DELETE RESTRICT;


--
-- Name: smn_link smn_link_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_link"
    ADD CONSTRAINT "smn_link_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_link smn_link_installation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_link"
    ADD CONSTRAINT "smn_link_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "public"."smn_installation"("id") ON DELETE RESTRICT;


--
-- Name: smn_link smn_link_team_same_installation_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_link"
    ADD CONSTRAINT "smn_link_team_same_installation_fk" FOREIGN KEY ("team_id", "installation_id") REFERENCES "public"."smn_team"("id", "installation_id") ON DELETE RESTRICT;


--
-- Name: smn_link smn_link_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_link"
    ADD CONSTRAINT "smn_link_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_meeting_actual_duration_audit smn_meeting_actual_duration_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_meeting_actual_duration_audit"
    ADD CONSTRAINT "smn_meeting_actual_duration_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_member_absence smn_member_absence_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_absence"
    ADD CONSTRAINT "smn_member_absence_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."smn_absence_category"("id") ON DELETE RESTRICT;


--
-- Name: smn_member_absence smn_member_absence_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_absence"
    ADD CONSTRAINT "smn_member_absence_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_member_absence_history smn_member_absence_history_absence_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_absence_history"
    ADD CONSTRAINT "smn_member_absence_history_absence_id_fkey" FOREIGN KEY ("absence_id") REFERENCES "public"."smn_member_absence"("id") ON DELETE RESTRICT;


--
-- Name: smn_member_absence_history smn_member_absence_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_absence_history"
    ADD CONSTRAINT "smn_member_absence_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_member_absence smn_member_absence_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_absence"
    ADD CONSTRAINT "smn_member_absence_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."smn_member"("id") ON DELETE RESTRICT;


--
-- Name: smn_member_absence smn_member_absence_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_absence"
    ADD CONSTRAINT "smn_member_absence_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_member smn_member_archived_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member"
    ADD CONSTRAINT "smn_member_archived_by_fkey" FOREIGN KEY ("archived_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_member_assignment smn_member_assignment_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_assignment"
    ADD CONSTRAINT "smn_member_assignment_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."smn_member"("id");


--
-- Name: smn_member_assignment smn_member_assignment_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_assignment"
    ADD CONSTRAINT "smn_member_assignment_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."smn_team"("id");


--
-- Name: smn_member_assignment_version smn_member_assignment_version_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_assignment_version"
    ADD CONSTRAINT "smn_member_assignment_version_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "public"."smn_member_assignment"("id");


--
-- Name: smn_member_assignment_version smn_member_assignment_version_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_assignment_version"
    ADD CONSTRAINT "smn_member_assignment_version_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_member_batch smn_member_batch_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_batch"
    ADD CONSTRAINT "smn_member_batch_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_member smn_member_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member"
    ADD CONSTRAINT "smn_member_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."smn_member_batch"("id");


--
-- Name: smn_member_batch smn_member_batch_installation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_batch"
    ADD CONSTRAINT "smn_member_batch_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "public"."smn_installation"("id");


--
-- Name: smn_member_batch smn_member_batch_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_batch"
    ADD CONSTRAINT "smn_member_batch_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."smn_team"("id");


--
-- Name: smn_member_calendar_exception smn_member_calendar_exception_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_calendar_exception"
    ADD CONSTRAINT "smn_member_calendar_exception_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_member_calendar_exception smn_member_calendar_exception_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_calendar_exception"
    ADD CONSTRAINT "smn_member_calendar_exception_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."smn_member"("id") ON DELETE RESTRICT;


--
-- Name: smn_member_calendar_week smn_member_calendar_week_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_calendar_week"
    ADD CONSTRAINT "smn_member_calendar_week_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_member_calendar_week smn_member_calendar_week_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_calendar_week"
    ADD CONSTRAINT "smn_member_calendar_week_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."smn_member"("id") ON DELETE RESTRICT;


--
-- Name: smn_member smn_member_company_same_installation_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member"
    ADD CONSTRAINT "smn_member_company_same_installation_fk" FOREIGN KEY ("installation_id", "company_id") REFERENCES "public"."smn_company"("installation_id", "id") ON DELETE RESTRICT;


--
-- Name: smn_member_identity_history smn_member_identity_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_identity_history"
    ADD CONSTRAINT "smn_member_identity_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_member_identity_history smn_member_identity_history_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_identity_history"
    ADD CONSTRAINT "smn_member_identity_history_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."smn_member"("id") ON DELETE RESTRICT;


--
-- Name: smn_member smn_member_installation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member"
    ADD CONSTRAINT "smn_member_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "public"."smn_installation"("id");


--
-- Name: smn_member_lifecycle_event smn_member_lifecycle_event_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_lifecycle_event"
    ADD CONSTRAINT "smn_member_lifecycle_event_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_member_location smn_member_location_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_location"
    ADD CONSTRAINT "smn_member_location_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_member_location smn_member_location_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_member_location"
    ADD CONSTRAINT "smn_member_location_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."smn_member"("id") ON DELETE RESTRICT;


--
-- Name: smn_national_calendar_coverage smn_national_calendar_coverage_country_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_national_calendar_coverage"
    ADD CONSTRAINT "smn_national_calendar_coverage_country_code_fkey" FOREIGN KEY ("country_code") REFERENCES "public"."smn_country"("code") ON DELETE RESTRICT;


--
-- Name: smn_national_calendar_coverage smn_national_calendar_coverage_validated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_national_calendar_coverage"
    ADD CONSTRAINT "smn_national_calendar_coverage_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_national_calendar_validation_audit smn_national_calendar_validation_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_national_calendar_validation_audit"
    ADD CONSTRAINT "smn_national_calendar_validation_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_national_calendar_validation_audit smn_national_calendar_validation_audit_country_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_national_calendar_validation_audit"
    ADD CONSTRAINT "smn_national_calendar_validation_audit_country_code_fkey" FOREIGN KEY ("country_code") REFERENCES "public"."smn_country"("code") ON DELETE RESTRICT;


--
-- Name: smn_national_holiday_audit smn_national_holiday_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_national_holiday_audit"
    ADD CONSTRAINT "smn_national_holiday_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_national_holiday_audit smn_national_holiday_audit_country_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_national_holiday_audit"
    ADD CONSTRAINT "smn_national_holiday_audit_country_code_fkey" FOREIGN KEY ("country_code") REFERENCES "public"."smn_country"("code") ON DELETE RESTRICT;


--
-- Name: smn_national_holiday smn_national_holiday_country_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_national_holiday"
    ADD CONSTRAINT "smn_national_holiday_country_code_fkey" FOREIGN KEY ("country_code") REFERENCES "public"."smn_country"("code") ON DELETE RESTRICT;


--
-- Name: smn_national_holiday_manual_audit smn_national_holiday_manual_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_national_holiday_manual_audit"
    ADD CONSTRAINT "smn_national_holiday_manual_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_national_holiday_manual_audit smn_national_holiday_manual_audit_country_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_national_holiday_manual_audit"
    ADD CONSTRAINT "smn_national_holiday_manual_audit_country_code_fkey" FOREIGN KEY ("country_code") REFERENCES "public"."smn_country"("code") ON DELETE RESTRICT;


--
-- Name: smn_product smn_product_installation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_product"
    ADD CONSTRAINT "smn_product_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "public"."smn_installation"("id");


--
-- Name: smn_recovery_phrase smn_recovery_phrase_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_recovery_phrase"
    ADD CONSTRAINT "smn_recovery_phrase_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."smn_account"("id") ON DELETE CASCADE;


--
-- Name: smn_registry_comment smn_registry_comment_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_registry_comment"
    ADD CONSTRAINT "smn_registry_comment_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_registry_comment smn_registry_comment_editor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_registry_comment"
    ADD CONSTRAINT "smn_registry_comment_editor_id_fkey" FOREIGN KEY ("editor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_registry_comment smn_registry_comment_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_registry_comment"
    ADD CONSTRAINT "smn_registry_comment_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."smn_registry_item"("id") ON DELETE RESTRICT;


--
-- Name: smn_registry_comment_revision smn_registry_comment_revision_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_registry_comment_revision"
    ADD CONSTRAINT "smn_registry_comment_revision_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_registry_comment_revision smn_registry_comment_revision_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_registry_comment_revision"
    ADD CONSTRAINT "smn_registry_comment_revision_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."smn_registry_comment"("id") ON DELETE RESTRICT;


--
-- Name: smn_registry_comment smn_registry_comment_withdrawn_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_registry_comment"
    ADD CONSTRAINT "smn_registry_comment_withdrawn_by_fkey" FOREIGN KEY ("withdrawn_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_registry_cycle_link_audit smn_registry_cycle_link_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_registry_cycle_link_audit"
    ADD CONSTRAINT "smn_registry_cycle_link_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_registry_cycle_link_audit smn_registry_cycle_link_audit_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_registry_cycle_link_audit"
    ADD CONSTRAINT "smn_registry_cycle_link_audit_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."smn_registry_item"("id") ON DELETE RESTRICT;


--
-- Name: smn_registry_cycle_link smn_registry_cycle_link_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_registry_cycle_link"
    ADD CONSTRAINT "smn_registry_cycle_link_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."smn_registry_item"("id") ON DELETE RESTRICT;


--
-- Name: smn_registry_cycle_link smn_registry_cycle_link_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_registry_cycle_link"
    ADD CONSTRAINT "smn_registry_cycle_link_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_registry_deadline_settings smn_registry_deadline_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_registry_deadline_settings"
    ADD CONSTRAINT "smn_registry_deadline_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_registry_item_audit smn_registry_item_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_registry_item_audit"
    ADD CONSTRAINT "smn_registry_item_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_registry_item_audit smn_registry_item_audit_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_registry_item_audit"
    ADD CONSTRAINT "smn_registry_item_audit_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."smn_registry_item"("id") ON DELETE RESTRICT;


--
-- Name: smn_registry_item smn_registry_item_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_registry_item"
    ADD CONSTRAINT "smn_registry_item_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_registry_item smn_registry_item_installation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_registry_item"
    ADD CONSTRAINT "smn_registry_item_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "public"."smn_installation"("id");


--
-- Name: smn_registry_item smn_registry_item_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_registry_item"
    ADD CONSTRAINT "smn_registry_item_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."smn_team"("id");


--
-- Name: smn_registry_linked_request smn_registry_linked_request_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_registry_linked_request"
    ADD CONSTRAINT "smn_registry_linked_request_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE RESTRICT;


--
-- Name: smn_registry_linked_request smn_registry_linked_request_new_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_registry_linked_request"
    ADD CONSTRAINT "smn_registry_linked_request_new_item_id_fkey" FOREIGN KEY ("new_item_id") REFERENCES "public"."smn_registry_item"("id") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: smn_registry_linked_request smn_registry_linked_request_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_registry_linked_request"
    ADD CONSTRAINT "smn_registry_linked_request_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."smn_registry_item"("id") ON DELETE RESTRICT;


--
-- Name: smn_registry_relation_audit smn_registry_relation_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_registry_relation_audit"
    ADD CONSTRAINT "smn_registry_relation_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_registry_relation_audit smn_registry_relation_audit_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_registry_relation_audit"
    ADD CONSTRAINT "smn_registry_relation_audit_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."smn_registry_item"("id") ON DELETE RESTRICT;


--
-- Name: smn_registry_relation smn_registry_relation_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_registry_relation"
    ADD CONSTRAINT "smn_registry_relation_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."smn_registry_item"("id") ON DELETE RESTRICT;


--
-- Name: smn_report_archive_grant smn_report_archive_grant_archive_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_archive_grant"
    ADD CONSTRAINT "smn_report_archive_grant_archive_id_fkey" FOREIGN KEY ("archive_id") REFERENCES "public"."smn_report_pdf_archive"("id") ON DELETE RESTRICT;


--
-- Name: smn_report_archive_grant smn_report_archive_grant_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_archive_grant"
    ADD CONSTRAINT "smn_report_archive_grant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."smn_account"("id") ON DELETE RESTRICT;


--
-- Name: smn_report_archive_visibility smn_report_archive_visibility_archive_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_archive_visibility"
    ADD CONSTRAINT "smn_report_archive_visibility_archive_id_fkey" FOREIGN KEY ("archive_id") REFERENCES "public"."smn_report_pdf_archive"("id") ON DELETE RESTRICT;


--
-- Name: smn_report_content_options_audit smn_report_content_options_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_content_options_audit"
    ADD CONSTRAINT "smn_report_content_options_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_report_content_options_audit smn_report_content_options_audit_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_content_options_audit"
    ADD CONSTRAINT "smn_report_content_options_audit_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_report_content_options smn_report_content_options_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_content_options"
    ADD CONSTRAINT "smn_report_content_options_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_report_content_options smn_report_content_options_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_content_options"
    ADD CONSTRAINT "smn_report_content_options_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_report_document smn_report_document_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_document"
    ADD CONSTRAINT "smn_report_document_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_report_document_session_write smn_report_document_session_write_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_document_session_write"
    ADD CONSTRAINT "smn_report_document_session_write_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."smn_report_document"("id") ON DELETE CASCADE;


--
-- Name: smn_report_document smn_report_document_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_document"
    ADD CONSTRAINT "smn_report_document_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_report_document smn_report_document_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_document"
    ADD CONSTRAINT "smn_report_document_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."smn_team"("id") ON DELETE RESTRICT;


--
-- Name: smn_report_document smn_report_document_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_document"
    ADD CONSTRAINT "smn_report_document_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_report_draft_audit smn_report_draft_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_draft_audit"
    ADD CONSTRAINT "smn_report_draft_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_report_draft_audit smn_report_draft_audit_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_draft_audit"
    ADD CONSTRAINT "smn_report_draft_audit_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_report_draft smn_report_draft_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_draft"
    ADD CONSTRAINT "smn_report_draft_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_report_draft smn_report_draft_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_draft"
    ADD CONSTRAINT "smn_report_draft_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_report_history_options smn_report_history_options_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_history_options"
    ADD CONSTRAINT "smn_report_history_options_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_report_history_options smn_report_history_options_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_history_options"
    ADD CONSTRAINT "smn_report_history_options_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_report_language smn_report_language_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_language"
    ADD CONSTRAINT "smn_report_language_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_report_language smn_report_language_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_language"
    ADD CONSTRAINT "smn_report_language_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_report_link_selection smn_report_link_selection_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_link_selection"
    ADD CONSTRAINT "smn_report_link_selection_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_report_link_selection smn_report_link_selection_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_link_selection"
    ADD CONSTRAINT "smn_report_link_selection_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_report_logo smn_report_logo_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_logo"
    ADD CONSTRAINT "smn_report_logo_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_report_logo smn_report_logo_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_logo"
    ADD CONSTRAINT "smn_report_logo_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_report_render_reference smn_report_render_reference_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_render_reference"
    ADD CONSTRAINT "smn_report_render_reference_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_report_section_options_audit smn_report_section_options_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_section_options_audit"
    ADD CONSTRAINT "smn_report_section_options_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_report_section_options_audit smn_report_section_options_audit_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_section_options_audit"
    ADD CONSTRAINT "smn_report_section_options_audit_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_report_section_options smn_report_section_options_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_section_options"
    ADD CONSTRAINT "smn_report_section_options_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_report_section_options smn_report_section_options_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_section_options"
    ADD CONSTRAINT "smn_report_section_options_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_report_studio_archive_snapshot smn_report_studio_archive_snapshot_archive_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_studio_archive_snapshot"
    ADD CONSTRAINT "smn_report_studio_archive_snapshot_archive_id_fkey" FOREIGN KEY ("archive_id") REFERENCES "public"."smn_report_pdf_archive"("id") ON DELETE RESTRICT;


--
-- Name: smn_report_team_context_options smn_report_team_context_options_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_team_context_options"
    ADD CONSTRAINT "smn_report_team_context_options_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_report_team_context_options smn_report_team_context_options_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_team_context_options"
    ADD CONSTRAINT "smn_report_team_context_options_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_report_template smn_report_template_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_report_template"
    ADD CONSTRAINT "smn_report_template_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_risk_assessment_audit smn_risk_assessment_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_risk_assessment_audit"
    ADD CONSTRAINT "smn_risk_assessment_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_risk_assessment_audit smn_risk_assessment_audit_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_risk_assessment_audit"
    ADD CONSTRAINT "smn_risk_assessment_audit_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."smn_registry_item"("id") ON DELETE RESTRICT;


--
-- Name: smn_risk_assessment smn_risk_assessment_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_risk_assessment"
    ADD CONSTRAINT "smn_risk_assessment_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."smn_registry_item"("id") ON DELETE RESTRICT;


--
-- Name: smn_risk_assessment smn_risk_assessment_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_risk_assessment"
    ADD CONSTRAINT "smn_risk_assessment_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_risk_roam_audit smn_risk_roam_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_risk_roam_audit"
    ADD CONSTRAINT "smn_risk_roam_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_risk_roam_audit smn_risk_roam_audit_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_risk_roam_audit"
    ADD CONSTRAINT "smn_risk_roam_audit_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."smn_registry_item"("id") ON DELETE RESTRICT;


--
-- Name: smn_risk_roam smn_risk_roam_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_risk_roam"
    ADD CONSTRAINT "smn_risk_roam_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."smn_registry_item"("id") ON DELETE RESTRICT;


--
-- Name: smn_risk_roam smn_risk_roam_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_risk_roam"
    ADD CONSTRAINT "smn_risk_roam_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_scrum_cadence_audit smn_scrum_cadence_audit_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_scrum_cadence_audit"
    ADD CONSTRAINT "smn_scrum_cadence_audit_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_scrum_cadence_audit smn_scrum_cadence_audit_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_scrum_cadence_audit"
    ADD CONSTRAINT "smn_scrum_cadence_audit_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."smn_team"("id") ON DELETE RESTRICT;


--
-- Name: smn_scrum_cadence smn_scrum_cadence_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_scrum_cadence"
    ADD CONSTRAINT "smn_scrum_cadence_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."smn_team"("id") ON DELETE RESTRICT;


--
-- Name: smn_scrum_cadence smn_scrum_cadence_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_scrum_cadence"
    ADD CONSTRAINT "smn_scrum_cadence_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_scrum_ceremony_template_history smn_scrum_ceremony_template_history_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_scrum_ceremony_template_history"
    ADD CONSTRAINT "smn_scrum_ceremony_template_history_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_scrum_ceremony_template_history smn_scrum_ceremony_template_history_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_scrum_ceremony_template_history"
    ADD CONSTRAINT "smn_scrum_ceremony_template_history_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."smn_scrum_ceremony_template"("id") ON DELETE RESTRICT;


--
-- Name: smn_scrum_ceremony_template smn_scrum_ceremony_template_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_scrum_ceremony_template"
    ADD CONSTRAINT "smn_scrum_ceremony_template_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."smn_team"("id") ON DELETE RESTRICT;


--
-- Name: smn_scrum_lunch smn_scrum_lunch_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_scrum_lunch"
    ADD CONSTRAINT "smn_scrum_lunch_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."smn_team"("id") ON DELETE RESTRICT;


--
-- Name: smn_scrum_template_occurrence smn_scrum_template_occurrence_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_scrum_template_occurrence"
    ADD CONSTRAINT "smn_scrum_template_occurrence_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_scrum_template_occurrence_status_history smn_scrum_template_occurrence_status_history_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_scrum_template_occurrence_status_history"
    ADD CONSTRAINT "smn_scrum_template_occurrence_status_history_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_scrum_template_occurrence_status_history smn_scrum_template_occurrence_status_history_occurrence_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_scrum_template_occurrence_status_history"
    ADD CONSTRAINT "smn_scrum_template_occurrence_status_history_occurrence_id_fkey" FOREIGN KEY ("occurrence_id") REFERENCES "public"."smn_scrum_template_occurrence"("id") ON DELETE RESTRICT;


--
-- Name: smn_scrum_template_occurrence smn_scrum_template_occurrence_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_scrum_template_occurrence"
    ADD CONSTRAINT "smn_scrum_template_occurrence_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."smn_scrum_ceremony_template"("id") ON DELETE RESTRICT;


--
-- Name: smn_sprint_audit smn_sprint_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_audit"
    ADD CONSTRAINT "smn_sprint_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_sprint_audit smn_sprint_audit_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_audit"
    ADD CONSTRAINT "smn_sprint_audit_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_sprint_batch_audit smn_sprint_batch_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_batch_audit"
    ADD CONSTRAINT "smn_sprint_batch_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_sprint_batch_audit smn_sprint_batch_audit_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_batch_audit"
    ADD CONSTRAINT "smn_sprint_batch_audit_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."smn_team"("id") ON DELETE RESTRICT;


--
-- Name: smn_sprint_batch_preview smn_sprint_batch_preview_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_batch_preview"
    ADD CONSTRAINT "smn_sprint_batch_preview_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE RESTRICT;


--
-- Name: smn_sprint_batch_preview smn_sprint_batch_preview_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_batch_preview"
    ADD CONSTRAINT "smn_sprint_batch_preview_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."smn_team"("id") ON DELETE RESTRICT;


--
-- Name: smn_sprint_capacity_kpi_audit smn_sprint_capacity_kpi_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_capacity_kpi_audit"
    ADD CONSTRAINT "smn_sprint_capacity_kpi_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_sprint_capacity_kpi_audit smn_sprint_capacity_kpi_audit_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_capacity_kpi_audit"
    ADD CONSTRAINT "smn_sprint_capacity_kpi_audit_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_sprint_capacity_kpi smn_sprint_capacity_kpi_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_capacity_kpi"
    ADD CONSTRAINT "smn_sprint_capacity_kpi_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_sprint_capacity_kpi smn_sprint_capacity_kpi_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_capacity_kpi"
    ADD CONSTRAINT "smn_sprint_capacity_kpi_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_sprint_capacity_trigger smn_sprint_capacity_trigger_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_capacity_trigger"
    ADD CONSTRAINT "smn_sprint_capacity_trigger_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_sprint_ceremony_history smn_sprint_ceremony_history_ceremony_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_ceremony_history"
    ADD CONSTRAINT "smn_sprint_ceremony_history_ceremony_id_fkey" FOREIGN KEY ("ceremony_id") REFERENCES "public"."smn_sprint_ceremony"("id") ON DELETE RESTRICT;


--
-- Name: smn_sprint_ceremony_history smn_sprint_ceremony_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_ceremony_history"
    ADD CONSTRAINT "smn_sprint_ceremony_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_sprint_ceremony_segment smn_sprint_ceremony_segment_ceremony_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_ceremony_segment"
    ADD CONSTRAINT "smn_sprint_ceremony_segment_ceremony_id_fkey" FOREIGN KEY ("ceremony_id") REFERENCES "public"."smn_sprint_ceremony"("id") ON DELETE CASCADE;


--
-- Name: smn_sprint_ceremony smn_sprint_ceremony_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_ceremony"
    ADD CONSTRAINT "smn_sprint_ceremony_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_sprint_ceremony_status_history smn_sprint_ceremony_status_history_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_ceremony_status_history"
    ADD CONSTRAINT "smn_sprint_ceremony_status_history_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_sprint_ceremony_status_history smn_sprint_ceremony_status_history_ceremony_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_ceremony_status_history"
    ADD CONSTRAINT "smn_sprint_ceremony_status_history_ceremony_id_fkey" FOREIGN KEY ("ceremony_id") REFERENCES "public"."smn_sprint_ceremony"("id") ON DELETE RESTRICT;


--
-- Name: smn_sprint_closure_audit smn_sprint_closure_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_closure_audit"
    ADD CONSTRAINT "smn_sprint_closure_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_sprint_closure_audit smn_sprint_closure_audit_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_closure_audit"
    ADD CONSTRAINT "smn_sprint_closure_audit_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_sprint_closure_snapshot smn_sprint_closure_snapshot_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_closure_snapshot"
    ADD CONSTRAINT "smn_sprint_closure_snapshot_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_sprint_closure_snapshot smn_sprint_closure_snapshot_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_closure_snapshot"
    ADD CONSTRAINT "smn_sprint_closure_snapshot_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_sprint smn_sprint_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint"
    ADD CONSTRAINT "smn_sprint_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_sprint smn_sprint_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint"
    ADD CONSTRAINT "smn_sprint_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_sprint_exceptional_meeting smn_sprint_exceptional_meeting_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_exceptional_meeting"
    ADD CONSTRAINT "smn_sprint_exceptional_meeting_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_sprint_exceptional_meeting_history smn_sprint_exceptional_meeting_history_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_exceptional_meeting_history"
    ADD CONSTRAINT "smn_sprint_exceptional_meeting_history_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_sprint_exceptional_meeting_history smn_sprint_exceptional_meeting_history_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_exceptional_meeting_history"
    ADD CONSTRAINT "smn_sprint_exceptional_meeting_history_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."smn_sprint_exceptional_meeting"("id") ON DELETE RESTRICT;


--
-- Name: smn_sprint_exceptional_meeting smn_sprint_exceptional_meeting_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_exceptional_meeting"
    ADD CONSTRAINT "smn_sprint_exceptional_meeting_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_sprint_exceptional_meeting_status_history smn_sprint_exceptional_meeting_status_history_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_exceptional_meeting_status_history"
    ADD CONSTRAINT "smn_sprint_exceptional_meeting_status_history_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_sprint_exceptional_meeting_status_history smn_sprint_exceptional_meeting_status_history_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_exceptional_meeting_status_history"
    ADD CONSTRAINT "smn_sprint_exceptional_meeting_status_history_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."smn_sprint_exceptional_meeting"("id") ON DELETE RESTRICT;


--
-- Name: smn_sprint_goal_audit smn_sprint_goal_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_goal_audit"
    ADD CONSTRAINT "smn_sprint_goal_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_sprint_goal_audit smn_sprint_goal_audit_goal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_goal_audit"
    ADD CONSTRAINT "smn_sprint_goal_audit_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "public"."smn_sprint_goal"("id") ON DELETE RESTRICT;


--
-- Name: smn_sprint_goal smn_sprint_goal_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_goal"
    ADD CONSTRAINT "smn_sprint_goal_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_sprint_goal smn_sprint_goal_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_goal"
    ADD CONSTRAINT "smn_sprint_goal_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_sprint_historical_actual_capacity_audit smn_sprint_historical_actual_capacity_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_historical_actual_capacity_audit"
    ADD CONSTRAINT "smn_sprint_historical_actual_capacity_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_sprint_historical_actual_capacity_audit smn_sprint_historical_actual_capacity_audit_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_historical_actual_capacity_audit"
    ADD CONSTRAINT "smn_sprint_historical_actual_capacity_audit_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_sprint_historical_actual_capacity smn_sprint_historical_actual_capacity_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_historical_actual_capacity"
    ADD CONSTRAINT "smn_sprint_historical_actual_capacity_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_sprint_historical_actual_capacity smn_sprint_historical_actual_capacity_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_historical_actual_capacity"
    ADD CONSTRAINT "smn_sprint_historical_actual_capacity_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_sprint_historical_capacity_audit smn_sprint_historical_capacity_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_historical_capacity_audit"
    ADD CONSTRAINT "smn_sprint_historical_capacity_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_sprint_historical_capacity_audit smn_sprint_historical_capacity_audit_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_historical_capacity_audit"
    ADD CONSTRAINT "smn_sprint_historical_capacity_audit_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_sprint_historical_capacity smn_sprint_historical_capacity_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_historical_capacity"
    ADD CONSTRAINT "smn_sprint_historical_capacity_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_sprint_historical_capacity smn_sprint_historical_capacity_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_historical_capacity"
    ADD CONSTRAINT "smn_sprint_historical_capacity_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_sprint_historical_event smn_sprint_historical_event_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_historical_event"
    ADD CONSTRAINT "smn_sprint_historical_event_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."smn_sprint_exceptional_meeting"("id") ON DELETE RESTRICT;


--
-- Name: smn_sprint_historical_goal_detail smn_sprint_historical_goal_detail_goal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_historical_goal_detail"
    ADD CONSTRAINT "smn_sprint_historical_goal_detail_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "public"."smn_sprint_goal"("id") ON DELETE RESTRICT;


--
-- Name: smn_sprint_historical_goal_detail smn_sprint_historical_goal_detail_recorded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_historical_goal_detail"
    ADD CONSTRAINT "smn_sprint_historical_goal_detail_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_sprint_historical_request smn_sprint_historical_request_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_historical_request"
    ADD CONSTRAINT "smn_sprint_historical_request_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_sprint_reschedule_audit smn_sprint_reschedule_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_reschedule_audit"
    ADD CONSTRAINT "smn_sprint_reschedule_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_sprint_reschedule_audit smn_sprint_reschedule_audit_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_reschedule_audit"
    ADD CONSTRAINT "smn_sprint_reschedule_audit_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_sprint_review_analysis_audit smn_sprint_review_analysis_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_review_analysis_audit"
    ADD CONSTRAINT "smn_sprint_review_analysis_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_sprint_review_analysis_audit smn_sprint_review_analysis_audit_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_review_analysis_audit"
    ADD CONSTRAINT "smn_sprint_review_analysis_audit_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_sprint_review_analysis smn_sprint_review_analysis_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_review_analysis"
    ADD CONSTRAINT "smn_sprint_review_analysis_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_sprint_review_analysis smn_sprint_review_analysis_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_review_analysis"
    ADD CONSTRAINT "smn_sprint_review_analysis_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_sprint_scores_audit smn_sprint_scores_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_scores_audit"
    ADD CONSTRAINT "smn_sprint_scores_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_sprint_scores_audit smn_sprint_scores_audit_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_scores_audit"
    ADD CONSTRAINT "smn_sprint_scores_audit_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_sprint_scores smn_sprint_scores_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_scores"
    ADD CONSTRAINT "smn_sprint_scores_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_sprint_scores smn_sprint_scores_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_scores"
    ADD CONSTRAINT "smn_sprint_scores_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_sprint_story_points_audit smn_sprint_story_points_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_story_points_audit"
    ADD CONSTRAINT "smn_sprint_story_points_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_sprint_story_points_audit smn_sprint_story_points_audit_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_story_points_audit"
    ADD CONSTRAINT "smn_sprint_story_points_audit_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_sprint_story_points smn_sprint_story_points_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_story_points"
    ADD CONSTRAINT "smn_sprint_story_points_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_sprint_story_points smn_sprint_story_points_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_story_points"
    ADD CONSTRAINT "smn_sprint_story_points_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_sprint smn_sprint_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint"
    ADD CONSTRAINT "smn_sprint_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."smn_team"("id") ON DELETE RESTRICT;


--
-- Name: smn_sprint_ticket_counts_audit smn_sprint_ticket_counts_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_ticket_counts_audit"
    ADD CONSTRAINT "smn_sprint_ticket_counts_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_sprint_ticket_counts_audit smn_sprint_ticket_counts_audit_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_ticket_counts_audit"
    ADD CONSTRAINT "smn_sprint_ticket_counts_audit_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_sprint_ticket_counts smn_sprint_ticket_counts_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_ticket_counts"
    ADD CONSTRAINT "smn_sprint_ticket_counts_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_sprint_ticket_counts smn_sprint_ticket_counts_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_ticket_counts"
    ADD CONSTRAINT "smn_sprint_ticket_counts_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_sprint_transition smn_sprint_transition_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_transition"
    ADD CONSTRAINT "smn_sprint_transition_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_sprint_transition smn_sprint_transition_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_transition"
    ADD CONSTRAINT "smn_sprint_transition_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "public"."smn_sprint"("id") ON DELETE RESTRICT;


--
-- Name: smn_sprint_wizard_preview smn_sprint_wizard_preview_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_wizard_preview"
    ADD CONSTRAINT "smn_sprint_wizard_preview_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE RESTRICT;


--
-- Name: smn_sprint_wizard_preview smn_sprint_wizard_preview_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_sprint_wizard_preview"
    ADD CONSTRAINT "smn_sprint_wizard_preview_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."smn_team"("id") ON DELETE RESTRICT;


--
-- Name: smn_team_context_audit smn_team_context_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_team_context_audit"
    ADD CONSTRAINT "smn_team_context_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_team_context_audit smn_team_context_audit_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_team_context_audit"
    ADD CONSTRAINT "smn_team_context_audit_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."smn_team"("id") ON DELETE RESTRICT;


--
-- Name: smn_team_context smn_team_context_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_team_context"
    ADD CONSTRAINT "smn_team_context_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."smn_team"("id") ON DELETE RESTRICT;


--
-- Name: smn_team_context smn_team_context_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_team_context"
    ADD CONSTRAINT "smn_team_context_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."smn_account"("id") ON DELETE SET NULL;


--
-- Name: smn_team smn_team_installation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_team"
    ADD CONSTRAINT "smn_team_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "public"."smn_installation"("id");


--
-- Name: smn_account_team_preference smn_team_pref_account_same_installation_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_account_team_preference"
    ADD CONSTRAINT "smn_team_pref_account_same_installation_fk" FOREIGN KEY ("account_id", "installation_id") REFERENCES "public"."smn_account"("id", "installation_id") ON DELETE CASCADE;


--
-- Name: smn_account_team_preference smn_team_pref_team_same_installation_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_account_team_preference"
    ADD CONSTRAINT "smn_team_pref_team_same_installation_fk" FOREIGN KEY ("team_id", "installation_id") REFERENCES "public"."smn_team"("id", "installation_id") ON DELETE RESTRICT;


--
-- Name: smn_team smn_team_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_team"
    ADD CONSTRAINT "smn_team_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."smn_product"("id");


--
-- Name: smn_team smn_team_product_same_installation_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."smn_team"
    ADD CONSTRAINT "smn_team_product_same_installation_fk" FOREIGN KEY ("product_id", "installation_id") REFERENCES "public"."smn_product"("id", "installation_id") ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--


