CREATE TABLE IF NOT EXISTS public.smn_scrum_cadence (
 team_id text PRIMARY KEY REFERENCES public.smn_team(id) ON DELETE RESTRICT,
 duration_weeks integer NOT NULL DEFAULT 2 CHECK (duration_weeks BETWEEN 1 AND 4),
 start_day integer NOT NULL DEFAULT 1 CHECK (start_day BETWEEN 1 AND 7),
 start_time time NOT NULL DEFAULT '09:00',
 end_day integer NOT NULL DEFAULT 5 CHECK (end_day BETWEEN 1 AND 7),
 end_time time NOT NULL DEFAULT '18:00',
 time_zone text NOT NULL DEFAULT 'Europe/Paris',
 revision integer NOT NULL DEFAULT 1 CHECK(revision>=1),
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 CHECK (end_day>start_day OR (end_day=start_day AND end_time>start_time))
);
CREATE TABLE IF NOT EXISTS public.smn_scrum_cadence_audit (
 id text PRIMARY KEY,
 team_id text NOT NULL REFERENCES public.smn_team(id) ON DELETE RESTRICT,
 revision integer NOT NULL,
 before_values jsonb NOT NULL,
 after_values jsonb NOT NULL,
 changed_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 changed_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(team_id,revision)
);
