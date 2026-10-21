CREATE TABLE public.smn_member_calendar_week (
 id text PRIMARY KEY,
 member_id text NOT NULL REFERENCES public.smn_member(id) ON DELETE RESTRICT,
 revision integer NOT NULL CHECK (revision>0),
 effective_from date NOT NULL,
 days jsonb NOT NULL CHECK (jsonb_typeof(days)='array' AND jsonb_array_length(days)=7),
 created_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(member_id,revision)
);
CREATE INDEX smn_member_calendar_week_effective_idx
 ON public.smn_member_calendar_week(member_id,effective_from DESC,revision DESC);
CREATE TABLE public.smn_member_calendar_exception (
 id text PRIMARY KEY,
 member_id text NOT NULL REFERENCES public.smn_member(id) ON DELETE RESTRICT,
 on_date date NOT NULL,
 revision integer NOT NULL CHECK (revision>0),
 morning boolean NOT NULL,
 afternoon boolean NOT NULL,
 note text CHECK (note IS NULL OR char_length(note)<=200),
 created_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(member_id,on_date,revision)
);
CREATE INDEX smn_member_calendar_exception_day_idx
 ON public.smn_member_calendar_exception(member_id,on_date,revision DESC);
UPDATE public.smn_installation SET schema_version=13
 WHERE id='singleton' AND schema_version=12;
