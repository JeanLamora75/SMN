-- SMN company catalog, guarded upgrade of team closures (v30 -> v31).
-- Run only via scripts/apply-company-schema-migration.ts, never on application startup.
DO $$
BEGIN
 IF (SELECT count(*) FROM public.smn_company_closure) <> 0
 OR (SELECT count(*) FROM public.smn_company_closure_history) <> 0 THEN
  RAISE EXCEPTION 'Existing company closures/history: manual review required; no destructive migration';
 END IF;
 IF (SELECT count(*) FROM public.smn_installation WHERE id='singleton' AND schema_version=30 AND state='initialized') <> 1 THEN
  RAISE EXCEPTION 'Expected initialized installation schema v30';
 END IF;
END $$;

CREATE TABLE public.smn_company (
 id text PRIMARY KEY,
 installation_id text NOT NULL REFERENCES public.smn_installation(id) ON DELETE RESTRICT,
 name varchar(120) NOT NULL,
 comment text,
 color text NOT NULL CHECK (color IN ('blue','indigo','violet','teal','green','amber','orange','red')),
 archived_at timestamptz,
 revision integer NOT NULL DEFAULT 1 CHECK (revision >= 1),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 created_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 CONSTRAINT smn_company_name_nonempty CHECK (length(btrim(name)) > 0),
 CONSTRAINT smn_company_installation_id_id_unique UNIQUE (installation_id,id)
);
CREATE UNIQUE INDEX smn_company_installation_name_uq
 ON public.smn_company (installation_id,lower(btrim(name)));
CREATE INDEX smn_company_installation_active_idx
 ON public.smn_company (installation_id,archived_at);

ALTER TABLE public.smn_member ADD COLUMN company_id text;
ALTER TABLE public.smn_member ADD CONSTRAINT smn_member_company_same_installation_fk
 FOREIGN KEY (installation_id,company_id)
 REFERENCES public.smn_company(installation_id,id) ON DELETE RESTRICT;
CREATE INDEX smn_member_company_idx ON public.smn_member(company_id)
 WHERE company_id IS NOT NULL;

ALTER TABLE public.smn_company_closure ADD COLUMN company_id text;
-- The source closure table is empty: replace team ownership rather than retain two models.
ALTER TABLE public.smn_company_closure DROP COLUMN team_id;
ALTER TABLE public.smn_company_closure ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.smn_company_closure ADD CONSTRAINT smn_closure_company_fk
 FOREIGN KEY (company_id) REFERENCES public.smn_company(id) ON DELETE RESTRICT;
CREATE INDEX smn_closure_company_period_idx
 ON public.smn_company_closure(company_id,start_on,end_on)
 WHERE is_active=true;

UPDATE public.smn_installation SET schema_version=31
 WHERE id='singleton' AND state='initialized' AND schema_version=30;
