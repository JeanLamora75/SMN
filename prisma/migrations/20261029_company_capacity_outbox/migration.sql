-- SMN v32: installation explicite de la file durable de recalcul entreprise.
-- Non destructif : conserve les jobs historiques existants.
CREATE TABLE IF NOT EXISTS public.smn_company_capacity_recalc (
 id text PRIMARY KEY,
 company_id text NOT NULL REFERENCES public.smn_company(id) ON DELETE RESTRICT,
 closure_id text NOT NULL REFERENCES public.smn_company_closure(id) ON DELETE RESTRICT,
 closure_revision integer NOT NULL CHECK(closure_revision>0),
 start_on date NOT NULL,
 end_on date NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','running','done','failed')),
 attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0),
 last_error text,
 result jsonb,
 next_attempt_at timestamptz NOT NULL DEFAULT now(),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(start_on<=end_on),
 UNIQUE(closure_id,closure_revision)
);
CREATE INDEX IF NOT EXISTS smn_company_capacity_recalc_due_idx
 ON public.smn_company_capacity_recalc(status,next_attempt_at);
