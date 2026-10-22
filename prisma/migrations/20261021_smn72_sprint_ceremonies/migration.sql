CREATE TABLE IF NOT EXISTS public.smn_sprint_ceremony(
 id text PRIMARY KEY,
 sprint_id text NOT NULL REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,
 kind text NOT NULL CHECK(kind IN ('planning','daily','review','retrospective')),
 starts_at timestamptz NOT NULL,
 ends_at timestamptz NOT NULL,
 minutes integer NOT NULL CHECK(minutes>0),
 generated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(ends_at>starts_at),
 UNIQUE(sprint_id,kind,starts_at)
);
CREATE INDEX IF NOT EXISTS smn_sprint_ceremony_range_idx
 ON public.smn_sprint_ceremony(sprint_id,starts_at);
