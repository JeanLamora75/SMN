-- Imports CSV historiques : migration explicite, additive, sans perte de données.
CREATE TABLE IF NOT EXISTS public.smn_historical_csv_attempt(
 id text PRIMARY KEY,actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 status text NOT NULL CHECK(status IN ('preview-valid','preview-refused','preview-cancelled','import-confirmed','import-refused')),
 mode text NOT NULL,scope text NOT NULL,batch_id text,
 read_count integer NOT NULL,recognized_count integer NOT NULL,
 applied_count integer NOT NULL,preserved_count integer NOT NULL,rejected_count integer NOT NULL,
 cycle_ids jsonb NOT NULL DEFAULT '[]'::jsonb,errors jsonb NOT NULL DEFAULT '[]'::jsonb);

CREATE TABLE IF NOT EXISTS public.smn_historical_csv_batch(
   id text PRIMARY KEY,mode text NOT NULL,actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
   created_at timestamptz NOT NULL DEFAULT clock_timestamp());

CREATE TABLE IF NOT EXISTS public.smn_historical_csv_change(
   id text PRIMARY KEY,batch_id text NOT NULL REFERENCES public.smn_historical_csv_batch(id) ON DELETE RESTRICT,
   cycle_id text NOT NULL,metric_code text NOT NULL,previous_value numeric(14,4),
   next_value numeric(14,4) NOT NULL,quality text NOT NULL CHECK(quality IN ('known','estimated')),
   action text NOT NULL,actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
   changed_at timestamptz NOT NULL DEFAULT clock_timestamp());

ALTER TABLE public.smn_historical_csv_change ADD COLUMN IF NOT EXISTS source_line integer;

ALTER TABLE public.smn_historical_csv_change ADD COLUMN IF NOT EXISTS previous_quality text;
