-- Consolidation SMN-270..281 : schema Pays additif sur main (version courante 29).
-- Les DDL historiques executes a la demande sont remplaces progressivement.
ALTER TABLE public.smn_country
  ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

ALTER TABLE public.smn_national_calendar_coverage
  ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS administrative_validated_at timestamptz,
  ADD COLUMN IF NOT EXISTS validated_revision integer,
  ADD COLUMN IF NOT EXISTS validated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS validation_source text;

CREATE TABLE IF NOT EXISTS public.smn_country_name_audit (
 id text PRIMARY KEY,
 country_code text NOT NULL REFERENCES public.smn_country(code) ON DELETE RESTRICT,
 revision integer NOT NULL CHECK (revision > 0),
 previous_name text NOT NULL,
 new_name text NOT NULL,
 actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 changed_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(country_code, revision)
);

CREATE TABLE IF NOT EXISTS public.smn_country_lifecycle_audit (
 id text PRIMARY KEY,
 country_code text NOT NULL REFERENCES public.smn_country(code) ON DELETE RESTRICT,
 action text NOT NULL CHECK (action IN ('archive','reactivate')),
 old_archived_at timestamptz,
 new_archived_at timestamptz,
 old_revision integer NOT NULL,
 new_revision integer NOT NULL,
 actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 occurred_at timestamptz NOT NULL DEFAULT now(),
 CHECK (new_revision=old_revision+1)
);
CREATE INDEX IF NOT EXISTS smn_country_lifecycle_audit_country_idx
 ON public.smn_country_lifecycle_audit(country_code,occurred_at);

CREATE TABLE IF NOT EXISTS public.smn_national_holiday_manual_audit (
 id text PRIMARY KEY,
 country_code text NOT NULL REFERENCES public.smn_country(code) ON DELETE RESTRICT,
 action text NOT NULL CHECK (action IN ('create','update','delete')),
 previous_date date,
 new_date date,
 previous_name text,
 new_name text,
 reason text NOT NULL CHECK(char_length(btrim(reason)) BETWEEN 1 AND 500),
 actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 occurred_at timestamptz NOT NULL DEFAULT now(),
 CHECK (
  (action='create' AND previous_date IS NULL AND previous_name IS NULL AND new_date IS NOT NULL AND new_name IS NOT NULL)
  OR (action='update' AND previous_date IS NOT NULL AND previous_name IS NOT NULL AND new_date IS NOT NULL AND new_name IS NOT NULL)
  OR (action='delete' AND previous_date IS NOT NULL AND previous_name IS NOT NULL AND new_date IS NULL AND new_name IS NULL)
 )
);
CREATE INDEX IF NOT EXISTS smn_national_holiday_manual_audit_country_idx
 ON public.smn_national_holiday_manual_audit(country_code,occurred_at);

CREATE TABLE IF NOT EXISTS public.smn_national_calendar_validation_audit (
 id text PRIMARY KEY,
 country_code text NOT NULL REFERENCES public.smn_country(code) ON DELETE RESTRICT,
 calendar_year integer NOT NULL CHECK(calendar_year BETWEEN 1900 AND 2200),
 action text NOT NULL CHECK(action IN ('validate','invalidate')),
 revision integer NOT NULL CHECK(revision >= 0),
 fingerprint text,
 actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 source text NOT NULL,
 occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS smn_national_calendar_validation_audit_idx
 ON public.smn_national_calendar_validation_audit(country_code,calendar_year,occurred_at);

-- Version strictement avancee seulement depuis la version connue.
UPDATE public.smn_installation SET schema_version=30
 WHERE id='singleton' AND schema_version=29;
