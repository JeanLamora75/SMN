ALTER TABLE public.smn_sprint_ceremony ADD COLUMN IF NOT EXISTS actual_minutes integer CHECK(actual_minutes BETWEEN 0 AND 1440);
ALTER TABLE public.smn_scrum_template_occurrence ADD COLUMN IF NOT EXISTS actual_minutes integer CHECK(actual_minutes BETWEEN 0 AND 1440);
ALTER TABLE public.smn_sprint_exceptional_meeting ADD COLUMN IF NOT EXISTS actual_minutes integer CHECK(actual_minutes BETWEEN 0 AND 1440);
CREATE TABLE IF NOT EXISTS public.smn_meeting_actual_duration_audit(
 id text PRIMARY KEY,kind text NOT NULL CHECK(kind IN ('standard','custom','exceptional')),
 event_id text NOT NULL,previous_minutes integer,new_minutes integer NOT NULL,
 planned_minutes integer NOT NULL,actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 changed_at timestamptz NOT NULL DEFAULT now()
);
