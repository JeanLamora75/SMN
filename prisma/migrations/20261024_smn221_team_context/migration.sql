-- Team-owned vision and Product Goal; no changes to immutable product identity.
CREATE TABLE IF NOT EXISTS public.smn_team_context (
 team_id text PRIMARY KEY REFERENCES public.smn_team(id) ON DELETE RESTRICT,
 vision text,
 product_goal text,
 dod text,
 dor text,
 language text,
 revision integer NOT NULL DEFAULT 1 CHECK(revision>0),
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL
);
ALTER TABLE public.smn_team_context
 ADD COLUMN IF NOT EXISTS vision text,
 ADD COLUMN IF NOT EXISTS product_goal text,
 ADD COLUMN IF NOT EXISTS dod text,
 ADD COLUMN IF NOT EXISTS dor text,
 ADD COLUMN IF NOT EXISTS language text,
 ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 1,
 ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
 ADD COLUMN IF NOT EXISTS updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL;
CREATE TABLE IF NOT EXISTS public.smn_team_context_audit (
 id text PRIMARY KEY,
 team_id text NOT NULL REFERENCES public.smn_team(id) ON DELETE RESTRICT,
 revision integer NOT NULL,
 before_values jsonb NOT NULL,
 after_values jsonb NOT NULL,
 actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 changed_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(team_id,revision)
);
