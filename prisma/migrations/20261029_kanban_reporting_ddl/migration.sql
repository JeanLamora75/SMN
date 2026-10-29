-- Additional Kanban objects discovered in full cross-module DDL audit.
CREATE TABLE IF NOT EXISTS public.smn_kanban_render_reference(
 id text PRIMARY KEY,period_id text NOT NULL REFERENCES public.smn_kanban_period(id) ON DELETE RESTRICT,
 created_at timestamptz NOT NULL DEFAULT now(),created_by text NOT NULL,
 sha256 text NOT NULL,payload jsonb NOT NULL);

CREATE TABLE IF NOT EXISTS public.smn_kanban_report_analysis_choice(
 period_id text PRIMARY KEY,selected_ids jsonb NOT NULL DEFAULT '[]'::jsonb,updated_at timestamptz NOT NULL DEFAULT now());
