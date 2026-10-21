CREATE TABLE IF NOT EXISTS public.smn_sprint (
 id text PRIMARY KEY,
 team_id text NOT NULL REFERENCES public.smn_team(id) ON DELETE RESTRICT,
 number integer NOT NULL CHECK(number>0),
 name text NOT NULL CHECK(length(btrim(name)) BETWEEN 1 AND 160),
 start_at timestamptz NOT NULL,
 end_at timestamptz NOT NULL,
 time_zone text NOT NULL,
 status text NOT NULL DEFAULT 'planned',
 created_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(end_at>start_at),
 UNIQUE(team_id,number)
);
CREATE INDEX IF NOT EXISTS smn_sprint_team_period_idx ON public.smn_sprint(team_id,start_at,end_at);
CREATE TABLE IF NOT EXISTS public.smn_sprint_audit (
 id text PRIMARY KEY,
 sprint_id text NOT NULL REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,
 action text NOT NULL,
 actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 occurred_at timestamptz NOT NULL DEFAULT now(),
 details jsonb NOT NULL
);
