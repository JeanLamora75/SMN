-- Kanban: additive, explicit schema extraction from business services.
-- Apply only using scripts/apply-kanban-schema-v32.ts --apply.
-- cadence
CREATE TABLE IF NOT EXISTS public.smn_kanban_cadence (
 team_id text PRIMARY KEY REFERENCES public.smn_team(id) ON DELETE RESTRICT,
 frequency text NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('monthly','weekly','biweekly')),
 start_day integer NOT NULL DEFAULT 1 CHECK (start_day BETWEEN 1 AND 7),
 time_zone text NOT NULL DEFAULT 'Europe/Paris',
 revision integer NOT NULL DEFAULT 1 CHECK (revision>=1),
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL
 );

-- cadence
CREATE TABLE IF NOT EXISTS public.smn_kanban_cadence_audit (
 id text PRIMARY KEY,team_id text NOT NULL REFERENCES public.smn_team(id) ON DELETE RESTRICT,
 revision integer NOT NULL,before_values jsonb NOT NULL,after_values jsonb NOT NULL,
 changed_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 changed_at timestamptz NOT NULL DEFAULT now(),UNIQUE(team_id,revision)
 );

-- periods
CREATE TABLE IF NOT EXISTS public.smn_kanban_period (
 id text PRIMARY KEY,team_id text NOT NULL REFERENCES public.smn_team(id) ON DELETE RESTRICT,
 name text NOT NULL,start_on date NOT NULL,end_on date NOT NULL,
 status text NOT NULL DEFAULT 'planned',
 time_zone text NOT NULL,
 created_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 deleted_at timestamptz,
 deleted_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 CHECK(end_on>=start_on)
 );

-- periods
ALTER TABLE public.smn_kanban_period ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- periods
ALTER TABLE public.smn_kanban_period ADD COLUMN IF NOT EXISTS deleted_by text REFERENCES public.smn_account(id) ON DELETE SET NULL;

-- periods
CREATE INDEX IF NOT EXISTS smn_kanban_period_team_dates_idx
 ON public.smn_kanban_period(team_id,start_on,end_on);

-- periods
CREATE TABLE IF NOT EXISTS public.smn_kanban_period_audit (
 id text PRIMARY KEY,period_id text NOT NULL REFERENCES public.smn_kanban_period(id) ON DELETE RESTRICT,
 action text NOT NULL,details jsonb NOT NULL,
 actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now()
 );

-- meetings
CREATE TABLE IF NOT EXISTS public.smn_kanban_meeting(
 id text PRIMARY KEY,period_id text NOT NULL REFERENCES public.smn_kanban_period(id) ON DELETE RESTRICT,
 name text NOT NULL,starts_at timestamptz NOT NULL,ends_at timestamptz NOT NULL,
 status text NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','held','not_held','cancelled')),
 provenance text NOT NULL DEFAULT 'manual' CHECK(provenance IN ('manual','exceptional')),
 created_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),CHECK(ends_at>starts_at));

-- goals
CREATE TABLE IF NOT EXISTS public.smn_kanban_goal (
 id text PRIMARY KEY,period_id text NOT NULL REFERENCES public.smn_kanban_period(id) ON DELETE RESTRICT,
 title text NOT NULL CHECK(length(btrim(title)) BETWEEN 1 AND 240),
 description text NOT NULL DEFAULT '',
 evaluation text NOT NULL DEFAULT 'not_evaluated' CHECK(evaluation IN ('not_evaluated','achieved','partially_achieved','not_achieved')),
 comment text,revision integer NOT NULL DEFAULT 1,
 created_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
 );

-- goals
CREATE TABLE IF NOT EXISTS public.smn_kanban_goal_audit (
 id text PRIMARY KEY,goal_id text NOT NULL REFERENCES public.smn_kanban_goal(id) ON DELETE RESTRICT,
 before_values jsonb,after_values jsonb NOT NULL,
 actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 changed_at timestamptz NOT NULL DEFAULT now()
 );

-- batch-create
CREATE TABLE IF NOT EXISTS public.smn_kanban_batch_audit (
   id text PRIMARY KEY,team_id text NOT NULL REFERENCES public.smn_team(id) ON DELETE RESTRICT,
   actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
   created_at timestamptz NOT NULL DEFAULT now(),
   cadence text NOT NULL,quantity integer NOT NULL CHECK(quantity BETWEEN 2 AND 6),
   cadence_revision integer NOT NULL,periods jsonb NOT NULL
  );

-- flow-counts
CREATE TABLE IF NOT EXISTS public.smn_kanban_flow_counts(
 period_id text PRIMARY KEY REFERENCES public.smn_kanban_period(id) ON DELETE RESTRICT,
 started bigint CHECK(started>=0),throughput bigint CHECK(throughput>=0),wip_final bigint CHECK(wip_final>=0),
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL);

-- flow-counts
CREATE TABLE IF NOT EXISTS public.smn_kanban_flow_audit(
 id text PRIMARY KEY,period_id text NOT NULL REFERENCES public.smn_kanban_period(id) ON DELETE RESTRICT,
 previous_values jsonb,next_values jsonb NOT NULL,
 actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now());

-- timing
CREATE TABLE IF NOT EXISTS public.smn_kanban_timing(
 period_id text PRIMARY KEY REFERENCES public.smn_kanban_period(id) ON DELETE RESTRICT,
 cycle_days numeric(14,6),cycle_convention text NOT NULL DEFAULT 'unknown',cycle_source text NOT NULL DEFAULT '',
 lead_days numeric(14,6),lead_convention text NOT NULL DEFAULT 'unknown',lead_source text NOT NULL DEFAULT '',
 updated_at timestamptz NOT NULL DEFAULT now(),updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL);

-- timing
CREATE TABLE IF NOT EXISTS public.smn_kanban_timing_audit(
 id text PRIMARY KEY,period_id text NOT NULL REFERENCES public.smn_kanban_period(id) ON DELETE RESTRICT,
 before_values jsonb,after_values jsonb NOT NULL,actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now());

-- qualitative
CREATE TABLE IF NOT EXISTS public.smn_kanban_registry_link(
 period_id text NOT NULL REFERENCES public.smn_kanban_period(id) ON DELETE RESTRICT,
 item_id text NOT NULL REFERENCES public.smn_registry_item(id) ON DELETE RESTRICT,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(period_id,item_id));

-- qualitative
CREATE TABLE IF NOT EXISTS public.smn_kanban_registry_link_audit(
 id text PRIMARY KEY,period_id text NOT NULL REFERENCES public.smn_kanban_period(id) ON DELETE RESTRICT,
 item_id text NOT NULL REFERENCES public.smn_registry_item(id) ON DELETE RESTRICT,
 action text NOT NULL CHECK(action IN ('linked','unlinked')),
 actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 changed_at timestamptz NOT NULL DEFAULT now());

-- states
CREATE TABLE IF NOT EXISTS public.smn_kanban_period_transition (
 id text PRIMARY KEY, period_id text NOT NULL REFERENCES public.smn_kanban_period(id) ON DELETE RESTRICT,
 transition text NOT NULL CHECK(transition IN ('started','ended')),
 business_on date NOT NULL, processed_at timestamptz NOT NULL DEFAULT now(),
 provenance text NOT NULL CHECK(provenance IN ('on-time','recovered')),
 UNIQUE(period_id,transition)
 );

-- states
CREATE TABLE IF NOT EXISTS public.smn_kanban_capacity_opening (
 period_id text PRIMARY KEY REFERENCES public.smn_kanban_period(id) ON DELETE RESTRICT,
 opened_on date NOT NULL, captured_at timestamptz NOT NULL DEFAULT now(),
 provenance text NOT NULL CHECK(provenance IN ('pending-capture','historical-unavailable')),
 initial_jh numeric(12,4),
 CHECK(provenance<>'historical-unavailable' OR initial_jh IS NULL)
 );

-- states
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint
 WHERE conname='smn_kanban_capacity_opening_provenance_v2_check'
 AND conrelid='public.smn_kanban_capacity_opening'::regclass) THEN
 ALTER TABLE public.smn_kanban_capacity_opening
 DROP CONSTRAINT IF EXISTS smn_kanban_capacity_opening_provenance_check;
 ALTER TABLE public.smn_kanban_capacity_opening
 ADD CONSTRAINT smn_kanban_capacity_opening_provenance_v2_check
 CHECK (provenance IN ('pending-capture','historical-unavailable','calculated','manual','unavailable-at-opening'));
 END IF;
 END; $$;

-- closure
CREATE TABLE IF NOT EXISTS public.smn_kanban_closure(
 id text PRIMARY KEY,period_id text NOT NULL REFERENCES public.smn_kanban_period(id) ON DELETE RESTRICT,
 version integer NOT NULL CHECK(version>0),snapshot jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 created_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 UNIQUE(period_id,version));
