ALTER TABLE public.smn_sprint_exceptional_meeting ADD COLUMN IF NOT EXISTS impacts_capacity boolean NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS public.smn_exceptional_capacity_impact_history(
 id text PRIMARY KEY,
 meeting_id text NOT NULL REFERENCES public.smn_sprint_exceptional_meeting(id) ON DELETE RESTRICT,
 previous_value boolean NOT NULL,
 new_value boolean NOT NULL,
 actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 changed_at timestamptz NOT NULL DEFAULT now()
);
