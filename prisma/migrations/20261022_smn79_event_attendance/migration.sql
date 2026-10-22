ALTER TABLE public.smn_sprint_ceremony ADD COLUMN IF NOT EXISTS status_explicit boolean NOT NULL DEFAULT false;
ALTER TABLE public.smn_scrum_template_occurrence ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'scheduled';
ALTER TABLE public.smn_scrum_template_occurrence ADD COLUMN IF NOT EXISTS status_explicit boolean NOT NULL DEFAULT false;
ALTER TABLE public.smn_sprint_exceptional_meeting ADD COLUMN IF NOT EXISTS status_explicit boolean NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS public.smn_sprint_ceremony_status_history (
 id text PRIMARY KEY,ceremony_id text NOT NULL REFERENCES public.smn_sprint_ceremony(id) ON DELETE RESTRICT,
 previous_status text NOT NULL,next_status text NOT NULL,reason text,
 actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,changed_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.smn_scrum_template_occurrence_status_history (
 id text PRIMARY KEY,occurrence_id text NOT NULL REFERENCES public.smn_scrum_template_occurrence(id) ON DELETE RESTRICT,
 previous_status text NOT NULL,next_status text NOT NULL,reason text,
 actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,changed_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.smn_sprint_exceptional_meeting_status_history (
 id text PRIMARY KEY,meeting_id text NOT NULL REFERENCES public.smn_sprint_exceptional_meeting(id) ON DELETE RESTRICT,
 previous_status text NOT NULL,next_status text NOT NULL,reason text,
 actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,changed_at timestamptz NOT NULL DEFAULT now()
);
