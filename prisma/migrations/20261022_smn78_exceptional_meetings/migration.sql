CREATE TABLE IF NOT EXISTS public.smn_sprint_exceptional_meeting (
 id text PRIMARY KEY,sprint_id text NOT NULL REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,
 name text NOT NULL CHECK(length(btrim(name)) BETWEEN 1 AND 160),
 starts_at timestamptz NOT NULL,ends_at timestamptz NOT NULL,
 duration_minutes integer NOT NULL CHECK(duration_minutes BETWEEN 1 AND 480),
 status text NOT NULL DEFAULT 'scheduled',
 created_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 revised_at timestamptz,
 CHECK(ends_at>starts_at)
);
CREATE TABLE IF NOT EXISTS public.smn_sprint_exceptional_meeting_history (
 id text PRIMARY KEY,meeting_id text NOT NULL REFERENCES public.smn_sprint_exceptional_meeting(id) ON DELETE RESTRICT,
 action text NOT NULL,actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 occurred_at timestamptz NOT NULL DEFAULT now(),details jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS smn_sprint_exceptional_meeting_start_idx ON public.smn_sprint_exceptional_meeting(sprint_id,starts_at);
