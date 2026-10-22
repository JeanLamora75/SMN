CREATE TABLE IF NOT EXISTS public.smn_scrum_lunch(
 team_id text PRIMARY KEY REFERENCES public.smn_team(id) ON DELETE RESTRICT,
 start_time time NOT NULL DEFAULT '12:00',
 end_time time NOT NULL DEFAULT '13:00',
 revision integer NOT NULL DEFAULT 1 CHECK(revision>0),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(start_time<end_time)
);
CREATE TABLE IF NOT EXISTS public.smn_sprint_ceremony_segment(
 ceremony_id text NOT NULL REFERENCES public.smn_sprint_ceremony(id) ON DELETE CASCADE,
 position integer NOT NULL CHECK(position>0),
 starts_at timestamptz NOT NULL,
 ends_at timestamptz NOT NULL,
 minutes integer NOT NULL CHECK(minutes>0),
 PRIMARY KEY(ceremony_id,position),
 CHECK(ends_at>starts_at)
);
