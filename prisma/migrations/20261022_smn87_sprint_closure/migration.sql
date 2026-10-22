CREATE TABLE IF NOT EXISTS public.smn_sprint_closure_snapshot (
 id text PRIMARY KEY,sprint_id text NOT NULL REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,
 version integer NOT NULL CHECK(version>=1),snapshot jsonb NOT NULL,
 actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 closed_at timestamptz NOT NULL DEFAULT now(),UNIQUE(sprint_id,version)
);
CREATE TABLE IF NOT EXISTS public.smn_sprint_closure_audit (
 id text PRIMARY KEY,sprint_id text NOT NULL REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,
 operation text NOT NULL CHECK(operation IN ('close','reopen')),
 previous_status text NOT NULL,next_status text NOT NULL,snapshot_version integer,
 actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 occurred_at timestamptz NOT NULL DEFAULT now()
);
