CREATE TABLE public.smn_backup_retention (
 installation_id text PRIMARY KEY REFERENCES public.smn_installation(id),
 days integer NOT NULL DEFAULT 30 CHECK (days BETWEEN 1 AND 3650),
 revision integer NOT NULL DEFAULT 0 CHECK (revision >= 0),
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL
);
CREATE TABLE public.smn_backup_retention_audit (
 id text PRIMARY KEY,
 installation_id text NOT NULL REFERENCES public.smn_installation(id),
 actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 action text NOT NULL CHECK (action IN ('policy_changed','package_deleted')),
 old_days integer,
 new_days integer,
 package_id text,
 occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX smn_backup_retention_audit_recent_idx
 ON public.smn_backup_retention_audit(occurred_at DESC,id DESC);
INSERT INTO public.smn_backup_retention(installation_id) VALUES ('singleton');
UPDATE public.smn_installation SET schema_version=8
 WHERE id='singleton' AND schema_version=7;
