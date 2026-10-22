-- Explicit, deliberately unconfigured: never invent a default workday.
CREATE TABLE IF NOT EXISTS public.smn_team_work_slots(
 team_id text PRIMARY KEY REFERENCES public.smn_team(id) ON DELETE RESTRICT,
 time_zone text NOT NULL,
 morning_start time NOT NULL,
 morning_end time NOT NULL,
 afternoon_start time NOT NULL,
 afternoon_end time NOT NULL,
 configured_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 configured_at timestamptz NOT NULL DEFAULT now(),
 revision integer NOT NULL DEFAULT 1,
 CHECK (morning_start < morning_end AND morning_end <= afternoon_start AND afternoon_start < afternoon_end)
);
