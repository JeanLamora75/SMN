CREATE TABLE public.smn_capacity_replanning (
 id text PRIMARY KEY,
 period_id text NOT NULL UNIQUE
  REFERENCES public.smn_capacity_period_override(id) ON DELETE RESTRICT,
 target_start_on date NOT NULL,
 target_end_on date NOT NULL,
 revision integer NOT NULL DEFAULT 1 CHECK(revision>=1),
 confirmed_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 confirmed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CONSTRAINT smn_replanning_dates CHECK(target_end_on>=target_start_on)
);
CREATE TABLE public.smn_capacity_replanning_history (
 id text PRIMARY KEY,
 replanning_id text NOT NULL REFERENCES public.smn_capacity_replanning(id) ON DELETE RESTRICT,
 revision integer NOT NULL CHECK(revision>=1),
 event_id text NOT NULL UNIQUE,
 previous_values jsonb,
 confirmed_values jsonb NOT NULL,
 preview_digest text NOT NULL CHECK(length(preview_digest)=64),
 confirmed_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 confirmed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(replanning_id,revision)
);
CREATE FUNCTION public.smn_replanning_history_immutable()
 RETURNS trigger LANGUAGE plpgsql AS $$
 BEGIN
  RAISE EXCEPTION 'replanning-history-is-immutable';
 END;
 $$;
CREATE TRIGGER smn_replanning_history_immutable_guard
 BEFORE UPDATE OR DELETE ON public.smn_capacity_replanning_history
 FOR EACH ROW EXECUTE FUNCTION public.smn_replanning_history_immutable();
UPDATE public.smn_installation SET schema_version=26
 WHERE id='singleton' AND schema_version=25;
