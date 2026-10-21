CREATE TABLE public.smn_capacity_initial_snapshot (
 id text PRIMARY KEY,
 period_id text NOT NULL UNIQUE
  REFERENCES public.smn_capacity_period_override(id) ON DELETE RESTRICT,
 event_id text NOT NULL UNIQUE,
 initial_jh numeric(12,4) CHECK(initial_jh >= 0),
 provenance text NOT NULL CHECK(provenance IN ('Saisie','Calcul','Non renseigné')),
 actual_opened_at timestamptz NOT NULL,
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 opened_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 manual_revision integer CHECK(manual_revision >= 0),
 CONSTRAINT smn_initial_source_check CHECK (
  (provenance='Non renseigné' AND initial_jh IS NULL)
  OR (provenance IN ('Saisie','Calcul') AND initial_jh IS NOT NULL)
 )
);
CREATE INDEX smn_capacity_initial_opened_idx
 ON public.smn_capacity_initial_snapshot(actual_opened_at);
CREATE FUNCTION public.smn_initial_snapshot_immutable()
 RETURNS trigger LANGUAGE plpgsql AS $
 BEGIN
  RAISE EXCEPTION 'initial-capacity-snapshot-is-immutable';
 END;
 $;
CREATE TRIGGER smn_initial_snapshot_immutable_write
 BEFORE UPDATE OR DELETE ON public.smn_capacity_initial_snapshot
 FOR EACH ROW EXECUTE FUNCTION public.smn_initial_snapshot_immutable();
UPDATE public.smn_installation SET schema_version=23
 WHERE id='singleton' AND schema_version=22;
