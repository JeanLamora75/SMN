CREATE TABLE public.smn_capacity_settings (
 installation_id text PRIMARY KEY REFERENCES public.smn_installation(id) ON DELETE RESTRICT,
 hours_per_jh numeric(4,2) NOT NULL DEFAULT 8
  CHECK(hours_per_jh >= 1 AND hours_per_jh <= 24),
 revision integer NOT NULL DEFAULT 1 CHECK(revision>=1),
 updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.smn_capacity_settings(installation_id,hours_per_jh)
 VALUES('singleton',8);
CREATE TABLE public.smn_capacity_settings_audit (
 id text PRIMARY KEY,
 installation_id text NOT NULL REFERENCES public.smn_capacity_settings(installation_id) ON DELETE RESTRICT,
 revision integer NOT NULL CHECK(revision>=2),
 previous_hours numeric(4,2) NOT NULL,
 new_hours numeric(4,2) NOT NULL,
 changed_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 changed_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(installation_id,revision)
);
UPDATE public.smn_installation SET schema_version=21
 WHERE id='singleton' AND schema_version=20;
