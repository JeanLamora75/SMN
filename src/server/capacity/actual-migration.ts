export const CAPACITY_ACTUAL_MIGRATION="20261021_smn60_actual_capacity";
export const CAPACITY_ACTUAL_MIGRATION_SQL=`CREATE TABLE public.smn_capacity_actual_override (
 id text PRIMARY KEY,
 period_id text NOT NULL UNIQUE REFERENCES public.smn_capacity_period_override(id) ON DELETE RESTRICT,
 manual_jh numeric(12,4) CHECK(manual_jh >= 0),
 revision integer NOT NULL DEFAULT 1 CHECK(revision>=1),
 updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.smn_capacity_actual_override_history (
 id text PRIMARY KEY,
 actual_id text NOT NULL REFERENCES public.smn_capacity_actual_override(id) ON DELETE RESTRICT,
 revision integer NOT NULL CHECK(revision>=1),
 operation text NOT NULL CHECK(operation IN ('set','clear')),
 before_jh numeric(12,4) CHECK(before_jh>=0),
 after_jh numeric(12,4) CHECK(after_jh>=0),
 changed_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 changed_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT smn_actual_audit_operation CHECK(
  (operation='set' AND after_jh IS NOT NULL)
  OR (operation='clear' AND after_jh IS NULL)
 ),
 UNIQUE(actual_id,revision)
);
CREATE TABLE public.smn_capacity_actual_snapshot (
 id text PRIMARY KEY,
 period_id text NOT NULL UNIQUE REFERENCES public.smn_capacity_period_override(id) ON DELETE RESTRICT,
 event_id text NOT NULL UNIQUE,
 retained_jh numeric(12,4) CHECK(retained_jh>=0),
 provenance text NOT NULL CHECK(provenance IN ('Saisie','Calcul','Non renseigné')),
 closed_at timestamptz NOT NULL,
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 closed_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 CONSTRAINT smn_actual_closed_source CHECK (
   (provenance='Non renseigné' AND retained_jh IS NULL)
   OR (provenance IN ('Saisie','Calcul') AND retained_jh IS NOT NULL)
 )
);
CREATE FUNCTION public.smn_actual_snapshot_immutable()
 RETURNS trigger LANGUAGE plpgsql AS $$
 BEGIN
  RAISE EXCEPTION 'actual-capacity-snapshot-is-immutable';
 END;
 $$;
CREATE TRIGGER smn_actual_snapshot_immutable_write
 BEFORE UPDATE OR DELETE ON public.smn_capacity_actual_snapshot
 FOR EACH ROW EXECUTE FUNCTION public.smn_actual_snapshot_immutable();
UPDATE public.smn_installation SET schema_version=24
 WHERE id='singleton' AND schema_version=23;
`;
