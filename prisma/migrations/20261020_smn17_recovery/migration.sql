CREATE TABLE public.smn_recovery_phrase (
  account_id text PRIMARY KEY REFERENCES public.smn_account(id) ON DELETE CASCADE,
  phrase_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.smn_auth_audit (
  id text PRIMARY KEY,
  account_id text NOT NULL REFERENCES public.smn_account(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('password_changed','recovery_prepared','recovery_used')),
  created_at timestamptz NOT NULL DEFAULT now()
);
UPDATE public.smn_installation SET schema_version=3 WHERE id='singleton' AND schema_version=2;
