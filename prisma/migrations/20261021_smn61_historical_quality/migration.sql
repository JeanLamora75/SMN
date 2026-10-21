CREATE TABLE public.smn_capacity_historical_quality (
 id text PRIMARY KEY,
 team_id text NOT NULL REFERENCES public.smn_team(id) ON DELETE RESTRICT,
 start_on date NOT NULL,
 end_on date NOT NULL,
 quality text NOT NULL CHECK(quality IN ('known','estimated','not-supplied')),
 qualified_jh numeric(12,4) CHECK(qualified_jh>=0),
 source_kind text CHECK(source_kind IN ('document','import','reconstruction','other')),
 source_ref text,
 rationale text NOT NULL,
 revision integer NOT NULL DEFAULT 1 CHECK(revision>=1),
 updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT smn_historical_quality_period CHECK(end_on>=start_on),
 CONSTRAINT smn_historical_quality_source CHECK(
  (quality='not-supplied' AND qualified_jh IS NULL AND source_kind IS NULL AND source_ref IS NULL)
  OR (quality='known' AND qualified_jh IS NOT NULL
   AND source_kind IN ('document','import','other')
   AND source_ref IS NOT NULL AND length(btrim(source_ref)) BETWEEN 3 AND 500)
  OR (quality='estimated' AND qualified_jh IS NOT NULL
   AND source_kind IS NOT NULL AND source_ref IS NOT NULL AND length(btrim(source_ref)) BETWEEN 3 AND 500)
 ),
 CONSTRAINT smn_historical_quality_rationale CHECK(length(btrim(rationale)) BETWEEN 5 AND 1000),
 UNIQUE(team_id,start_on,end_on)
);
CREATE TABLE public.smn_capacity_historical_quality_history (
 id text PRIMARY KEY,
 qualification_id text NOT NULL REFERENCES public.smn_capacity_historical_quality(id) ON DELETE RESTRICT,
 revision integer NOT NULL CHECK(revision>=1),
 before_values jsonb,
 after_values jsonb NOT NULL,
 changed_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 changed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(qualification_id,revision)
);
CREATE FUNCTION public.smn_historical_quality_history_immutable()
 RETURNS trigger LANGUAGE plpgsql AS $$
 BEGIN
  RAISE EXCEPTION 'historical-quality-audit-is-immutable';
 END;
 $$;
CREATE TRIGGER smn_historical_quality_history_guard
 BEFORE UPDATE OR DELETE ON public.smn_capacity_historical_quality_history
 FOR EACH ROW EXECUTE FUNCTION public.smn_historical_quality_history_immutable();
UPDATE public.smn_installation SET schema_version=25
 WHERE id='singleton' AND schema_version=24;
