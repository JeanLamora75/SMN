-- Additive migration: legacy per-sprint report options, snapshots and PDF archives stay unchanged.
CREATE TABLE IF NOT EXISTS public.smn_report_document(
 id text PRIMARY KEY,
 sprint_id text NOT NULL REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,
 team_id text NOT NULL REFERENCES public.smn_team(id) ON DELETE RESTRICT,
 title text NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 120),
 language text NOT NULL CHECK(language IN ('fr','en')),
 status text NOT NULL DEFAULT 'draft' CHECK(status='draft'),
 template_id text NOT NULL,
 template_version integer NOT NULL CHECK(template_version>=0),
 content jsonb NOT NULL CHECK(jsonb_typeof(content)='object'),
 revision integer NOT NULL DEFAULT 1 CHECK(revision>=1),
 created_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS smn_report_document_sprint_idx
 ON public.smn_report_document(sprint_id,updated_at DESC);
