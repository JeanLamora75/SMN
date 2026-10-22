-- Complement of the previous Epic 4 migrations. Run after SMN-87.
ALTER TABLE public.smn_scrum_template_occurrence
 ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'scheduled',
 ADD COLUMN IF NOT EXISTS status_explicit boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS actual_minutes integer CHECK(actual_minutes BETWEEN 0 AND 1440);
CREATE OR REPLACE FUNCTION public.smn_reject_closure_snapshot_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 RAISE EXCEPTION 'Sprint closure snapshots are immutable';
END $$;
DROP TRIGGER IF EXISTS smn_closure_snapshot_immutable ON public.smn_sprint_closure_snapshot;
CREATE TRIGGER smn_closure_snapshot_immutable
 BEFORE UPDATE OR DELETE ON public.smn_sprint_closure_snapshot
 FOR EACH ROW EXECUTE FUNCTION public.smn_reject_closure_snapshot_mutation();
