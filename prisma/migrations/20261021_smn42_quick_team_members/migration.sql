CREATE TABLE public.smn_member_batch (
 id text PRIMARY KEY,
 installation_id text NOT NULL REFERENCES public.smn_installation(id),
 team_id text NOT NULL REFERENCES public.smn_team(id),
 requested_count integer NOT NULL CHECK (requested_count BETWEEN 3 AND 50),
 created_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.smn_member (
 id text PRIMARY KEY,
 installation_id text NOT NULL REFERENCES public.smn_installation(id),
 batch_id text NOT NULL REFERENCES public.smn_member_batch(id),
 member_number integer NOT NULL CHECK (member_number > 0),
 display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 120),
 is_provisional boolean NOT NULL DEFAULT true,
 contract_percent integer NOT NULL DEFAULT 100 CHECK (contract_percent BETWEEN 0 AND 100),
 contribution_percent integer NOT NULL DEFAULT 100 CHECK (contribution_percent BETWEEN 0 AND 100),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (installation_id,member_number)
);
CREATE TABLE public.smn_member_assignment (
 id text PRIMARY KEY,
 member_id text NOT NULL REFERENCES public.smn_member(id),
 team_id text NOT NULL REFERENCES public.smn_team(id),
 start_on date NOT NULL DEFAULT CURRENT_DATE,
 end_on date,
 agile_role text NOT NULL CHECK (agile_role IN ('scrum_master','product_owner','developer')),
 allocation_percent integer NOT NULL DEFAULT 100 CHECK (allocation_percent BETWEEN 0 AND 100),
 role_percent integer NOT NULL DEFAULT 100 CHECK (role_percent BETWEEN 0 AND 100),
 CHECK (end_on IS NULL OR end_on >= start_on),
 UNIQUE (member_id,team_id,start_on)
);
CREATE UNIQUE INDEX smn_member_assignment_one_initial_idx
 ON public.smn_member_assignment(member_id) WHERE end_on IS NULL;
CREATE INDEX smn_member_assignment_team_idx
 ON public.smn_member_assignment(team_id,start_on,member_id);
UPDATE public.smn_installation SET schema_version=9
 WHERE id='singleton' AND schema_version=8;
