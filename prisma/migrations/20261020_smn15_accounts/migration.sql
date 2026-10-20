ALTER TABLE public.smn_account
  ADD COLUMN is_active boolean NOT NULL DEFAULT true;
CREATE UNIQUE INDEX smn_account_username_ci_key
  ON public.smn_account(lower(username));
CREATE UNIQUE INDEX smn_account_email_ci_key
  ON public.smn_account(lower(email));
UPDATE public.smn_installation SET schema_version=2 WHERE id='singleton' AND schema_version=1;
