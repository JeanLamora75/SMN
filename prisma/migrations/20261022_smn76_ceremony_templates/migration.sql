CREATE TABLE IF NOT EXISTS public.smn_scrum_ceremony_template (
 id text PRIMARY KEY,team_id text NOT NULL REFERENCES public.smn_team(id) ON DELETE RESTRICT,
 name text NOT NULL CHECK(length(btrim(name)) BETWEEN 1 AND 120),
 frequency text NOT NULL CHECK(frequency IN ('daily','weekly','sprint')),
 weekday integer CHECK(weekday BETWEEN 1 AND 7),position text CHECK(position IN ('start','end')),
 local_time time NOT NULL,duration_minutes integer NOT NULL CHECK(duration_minutes BETWEEN 1 AND 480),
 active boolean NOT NULL DEFAULT true,revision integer NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK((frequency='daily' AND weekday IS NULL AND position IS NULL)
 OR(frequency='weekly' AND weekday IS NOT NULL AND position IS NULL)
 OR(frequency='sprint' AND weekday IS NULL AND position IS NOT NULL))
);
CREATE TABLE IF NOT EXISTS public.smn_scrum_ceremony_template_history (
 id text PRIMARY KEY,template_id text NOT NULL REFERENCES public.smn_scrum_ceremony_template(id) ON DELETE RESTRICT,
 revision integer NOT NULL,before_values jsonb,after_values jsonb NOT NULL,
 actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 changed_at timestamptz NOT NULL DEFAULT now(),UNIQUE(template_id,revision)
);
CREATE TABLE IF NOT EXISTS public.smn_scrum_template_occurrence (
 id text PRIMARY KEY,template_id text NOT NULL REFERENCES public.smn_scrum_ceremony_template(id) ON DELETE RESTRICT,
 template_revision integer NOT NULL,sprint_id text NOT NULL REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,
 name text NOT NULL,starts_at timestamptz NOT NULL,ends_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(ends_at>starts_at),UNIQUE(template_id,sprint_id,starts_at)
);
