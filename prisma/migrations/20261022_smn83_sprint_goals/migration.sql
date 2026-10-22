CREATE TABLE IF NOT EXISTS public.smn_sprint_goal (
 id text PRIMARY KEY,sprint_id text NOT NULL REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,
 title text NOT NULL CHECK(length(btrim(title)) BETWEEN 1 AND 240),
 evaluation text NOT NULL DEFAULT 'not_evaluated' CHECK(evaluation IN ('not_evaluated','achieved','partially_achieved','not_achieved')),
 comment text,revision integer NOT NULL DEFAULT 1 CHECK(revision>0),
 created_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.smn_sprint_goal_audit(
 id text PRIMARY KEY,goal_id text NOT NULL REFERENCES public.smn_sprint_goal(id) ON DELETE RESTRICT,
 previous_values jsonb,next_values jsonb NOT NULL,
 actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 changed_at timestamptz NOT NULL DEFAULT now()
);
