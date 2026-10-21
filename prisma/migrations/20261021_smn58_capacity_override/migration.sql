CREATE TABLE public.smn_capacity_period_override (
 id text PRIMARY KEY,
 team_id text NOT NULL REFERENCES public.smn_team(id) ON DELETE RESTRICT,
 start_on date NOT NULL,
 end_on date NOT NULL,
 manual_jh numeric(12,4) CHECK (manual_jh >= 0),
 revision integer NOT NULL DEFAULT 1 CHECK (revision >= 1),
 frozen_at timestamptz,
 closed_at timestamptz,
 updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT smn_capacity_period_override_order CHECK (end_on >= start_on),
 CONSTRAINT smn_capacity_period_override_unique UNIQUE (team_id,start_on,end_on)
);
CREATE INDEX smn_capacity_period_override_team_idx
 ON public.smn_capacity_period_override(team_id,start_on,end_on);
CREATE TABLE public.smn_capacity_period_override_history (
 id text PRIMARY KEY,
 period_id text NOT NULL REFERENCES public.smn_capacity_period_override(id) ON DELETE RESTRICT,
 revision integer NOT NULL CHECK (revision >= 1),
 operation text NOT NULL CHECK (operation IN ('set','clear')),
 before_jh numeric(12,4) CHECK (before_jh >= 0),
 after_jh numeric(12,4) CHECK (after_jh >= 0),
 changed_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 changed_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT smn_capacity_period_history_set CHECK (
  (operation='set' AND after_jh IS NOT NULL) OR
  (operation='clear' AND after_jh IS NULL)
 ),
 UNIQUE(period_id,revision)
);
CREATE INDEX smn_capacity_period_history_lookup_idx
 ON public.smn_capacity_period_override_history(period_id,changed_at);
UPDATE public.smn_installation SET schema_version=22
 WHERE id='singleton' AND schema_version=21;
