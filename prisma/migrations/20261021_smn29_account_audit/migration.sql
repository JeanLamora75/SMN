CREATE TABLE public.smn_account_audit (
 id text PRIMARY KEY,
 installation_id text NOT NULL REFERENCES public.smn_installation(id),
 actor_id text,
 object_id text NOT NULL,
 action text NOT NULL CHECK (action IN ('account_created','account_updated')),
 outcome text NOT NULL DEFAULT 'success' CHECK (outcome='success'),
 old_values jsonb NOT NULL DEFAULT '{}'::jsonb,
 new_values jsonb NOT NULL DEFAULT '{}'::jsonb,
 occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX smn_account_audit_recent_idx ON public.smn_account_audit(occurred_at DESC,id DESC);
UPDATE public.smn_installation SET schema_version=7
 WHERE id='singleton' AND schema_version=6;
