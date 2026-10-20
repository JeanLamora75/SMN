CREATE TABLE public.smn_general_settings (
  installation_id text PRIMARY KEY REFERENCES public.smn_installation(id),
  locale text NOT NULL DEFAULT 'fr' CHECK (locale IN ('fr','en')),
  theme text NOT NULL DEFAULT 'light' CHECK (theme IN ('light','dark')),
  reference_country text CHECK (reference_country IS NULL OR reference_country ~ '^[A-Z]{2}$'),
  revision integer NOT NULL DEFAULT 0 CHECK (revision >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL
);
CREATE TABLE public.smn_general_settings_audit (
  id text PRIMARY KEY,
  installation_id text NOT NULL REFERENCES public.smn_installation(id),
  actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
  old_values jsonb NOT NULL,
  new_values jsonb NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.smn_general_settings(installation_id) VALUES('singleton');
UPDATE public.smn_installation SET schema_version=4
 WHERE id='singleton' AND schema_version=3;
