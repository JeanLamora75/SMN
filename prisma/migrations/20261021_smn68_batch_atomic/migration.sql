CREATE TABLE IF NOT EXISTS public.smn_sprint_batch_preview (
 token text PRIMARY KEY,
 team_id text NOT NULL REFERENCES public.smn_team(id) ON DELETE RESTRICT,
 actor_id text NOT NULL REFERENCES public.smn_account(id) ON DELETE RESTRICT,
 start_on date NOT NULL,
 count integer NOT NULL CHECK (count BETWEEN 2 AND 6),
 digest text NOT NULL,
 expires_at timestamptz NOT NULL,
 consumed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.smn_sprint_batch_audit (
 id text PRIMARY KEY,
 team_id text NOT NULL REFERENCES public.smn_team(id) ON DELETE RESTRICT,
 actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 occurred_at timestamptz NOT NULL DEFAULT now(),
 cadence jsonb NOT NULL,
 sprints jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS smn_sprint_batch_audit_team_date_idx
 ON public.smn_sprint_batch_audit(team_id,occurred_at DESC);
