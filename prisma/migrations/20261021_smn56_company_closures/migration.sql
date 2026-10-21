CREATE TABLE public.smn_company_closure (
 id text PRIMARY KEY,
 team_id text NOT NULL REFERENCES public.smn_team(id) ON DELETE RESTRICT,
 name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
 start_on date NOT NULL,
 end_on date NOT NULL,
 is_active boolean NOT NULL DEFAULT true,
 revision integer NOT NULL DEFAULT 1 CHECK (revision>=1),
 created_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT smn_company_closure_date_order CHECK (start_on<=end_on)
);
CREATE INDEX smn_company_closure_team_dates_idx
 ON public.smn_company_closure(team_id,start_on,end_on);
CREATE TABLE public.smn_company_closure_history (
 id text PRIMARY KEY,
 closure_id text NOT NULL REFERENCES public.smn_company_closure(id) ON DELETE RESTRICT,
 revision integer NOT NULL CHECK (revision>=1),
 operation text NOT NULL CHECK (operation IN ('create','update')),
 previous_values jsonb,
 next_values jsonb NOT NULL CHECK(jsonb_typeof(next_values)='object'),
 changed_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 changed_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(closure_id,revision)
);
CREATE INDEX smn_company_closure_history_idx
 ON public.smn_company_closure_history(closure_id,changed_at);
UPDATE public.smn_installation SET schema_version=20
 WHERE id='singleton' AND schema_version=19;
