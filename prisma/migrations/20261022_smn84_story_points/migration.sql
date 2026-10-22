CREATE TABLE IF NOT EXISTS public.smn_sprint_story_points (
 sprint_id text PRIMARY KEY REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,
 initial_sp bigint CHECK(initial_sp BETWEEN 0 AND 1000000000),
 added_sp bigint CHECK(added_sp BETWEEN 0 AND 1000000000),
 removed_sp bigint CHECK(removed_sp BETWEEN 0 AND 1000000000),
 done_sp bigint CHECK(done_sp BETWEEN 0 AND 1000000000),
 revision integer NOT NULL DEFAULT 1,
 updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.smn_sprint_story_points_audit (
 id text PRIMARY KEY,sprint_id text NOT NULL REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,
 before_values jsonb,after_values jsonb NOT NULL,
 actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 changed_at timestamptz NOT NULL DEFAULT now()
);
