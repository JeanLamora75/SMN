CREATE TABLE public.smn_member_assignment_version (
 id text PRIMARY KEY,
 assignment_id text NOT NULL REFERENCES public.smn_member_assignment(id),
 revision integer NOT NULL CHECK (revision >= 1),
 effective_from date NOT NULL,
 allocation_percent integer NOT NULL CHECK (allocation_percent BETWEEN 0 AND 100),
 contract_percent integer NOT NULL CHECK (contract_percent BETWEEN 0 AND 100),
 contribution_percent integer NOT NULL CHECK (contribution_percent BETWEEN 0 AND 100),
 scrum_master_percent integer NOT NULL CHECK (scrum_master_percent BETWEEN 0 AND 100),
 product_owner_percent integer NOT NULL CHECK (product_owner_percent BETWEEN 0 AND 100),
 developer_percent integer NOT NULL CHECK (developer_percent BETWEEN 0 AND 100),
 created_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (assignment_id,revision),
 CHECK (allocation_percent <= contract_percent),
 CHECK (scrum_master_percent + product_owner_percent + developer_percent = 100)
);
CREATE INDEX smn_member_assignment_version_effective_idx
 ON public.smn_member_assignment_version(assignment_id,effective_from DESC,revision DESC);
INSERT INTO public.smn_member_assignment_version
 (id,assignment_id,revision,effective_from,allocation_percent,contract_percent,
  contribution_percent,scrum_master_percent,product_owner_percent,developer_percent)
SELECT md5(a.id || ':initial'),a.id,1,a.start_on,a.allocation_percent,
 m.contract_percent,m.contribution_percent,
 CASE WHEN a.agile_role='scrum_master' THEN 100 ELSE 0 END,
 CASE WHEN a.agile_role='product_owner' THEN 100 ELSE 0 END,
 CASE WHEN a.agile_role='developer' THEN 100 ELSE 0 END
FROM public.smn_member_assignment a
 JOIN public.smn_member m ON m.id=a.member_id AND m.installation_id='singleton';
UPDATE public.smn_installation SET schema_version=11 WHERE id='singleton' AND schema_version=10;
