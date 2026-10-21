ALTER TABLE public.smn_sprint ADD COLUMN IF NOT EXISTS auto_suspended boolean NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS public.smn_sprint_transition (
 id text PRIMARY KEY,
 sprint_id text NOT NULL REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,
 transition text NOT NULL CHECK(transition IN ('started','ended','suspended','resumed')),
 business_at timestamptz NOT NULL,
 processed_at timestamptz NOT NULL DEFAULT now(),
 actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 UNIQUE(sprint_id,transition)
);
CREATE TABLE IF NOT EXISTS public.smn_sprint_capacity_trigger (
 sprint_id text PRIMARY KEY REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,
 due_at timestamptz NOT NULL,
 requested_at timestamptz NOT NULL DEFAULT now(),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processed','failed'))
);
