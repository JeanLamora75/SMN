CREATE TABLE IF NOT EXISTS public.smn_sprint_reschedule_audit(
 id text PRIMARY KEY,
 sprint_id text NOT NULL REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,
 old_start timestamptz NOT NULL,old_end timestamptz NOT NULL,
 new_start timestamptz NOT NULL,new_end timestamptz NOT NULL,
 mode text NOT NULL,actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 occurred_at timestamptz NOT NULL DEFAULT now()
);
