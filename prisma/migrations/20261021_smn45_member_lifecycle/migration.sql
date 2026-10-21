ALTER TABLE public.smn_member
 ADD COLUMN archived_at timestamptz,
 ADD COLUMN archived_by text REFERENCES public.smn_account(id) ON DELETE SET NULL;
CREATE TABLE public.smn_member_lifecycle_event (
 id text PRIMARY KEY,
 member_id text NOT NULL,
 assignment_id text,
 action text NOT NULL CHECK (action IN ('close','archive','reactivate','delete')),
 effective_on date NOT NULL,
 performed_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 occurred_at timestamptz NOT NULL DEFAULT now(),
 details jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX smn_member_lifecycle_event_member_idx
 ON public.smn_member_lifecycle_event(member_id,occurred_at DESC);
UPDATE public.smn_installation SET schema_version=12
 WHERE id='singleton' AND schema_version=11;
