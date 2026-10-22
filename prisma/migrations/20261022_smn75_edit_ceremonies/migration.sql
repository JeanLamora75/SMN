ALTER TABLE public.smn_sprint_ceremony ADD COLUMN IF NOT EXISTS provenance text NOT NULL DEFAULT 'generated';
ALTER TABLE public.smn_sprint_ceremony ADD COLUMN IF NOT EXISTS occurrence_status text NOT NULL DEFAULT 'scheduled';
ALTER TABLE public.smn_sprint_ceremony ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 1;
CREATE TABLE IF NOT EXISTS public.smn_sprint_ceremony_history (
 id text PRIMARY KEY,
 ceremony_id text NOT NULL REFERENCES public.smn_sprint_ceremony(id) ON DELETE RESTRICT,
 revision integer NOT NULL,
 previous_values jsonb NOT NULL,
 next_values jsonb NOT NULL,
 changed_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 changed_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(ceremony_id,revision)
);
