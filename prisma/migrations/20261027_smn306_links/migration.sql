-- SMN-306: additive and tenant-scoped; schema_version remains 28 (SMN-282).
CREATE TABLE public.smn_link_category (
 id text PRIMARY KEY,
 installation_id text NOT NULL REFERENCES public.smn_installation(id) ON DELETE RESTRICT,
 name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 100),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (id, installation_id)
);
CREATE UNIQUE INDEX smn_link_category_name_ci_key
 ON public.smn_link_category(installation_id, lower(btrim(name)));

CREATE TABLE public.smn_link (
 id text PRIMARY KEY,
 installation_id text NOT NULL REFERENCES public.smn_installation(id) ON DELETE RESTRICT,
 title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 200),
 url text NOT NULL CHECK (url ~* '^https?://[^[:space:]]+$'),
 description text,
 category_id text NOT NULL,
 scope text NOT NULL CHECK (scope IN ('TRANSVERSE','EQUIPE')),
 team_id text,
 created_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
 CONSTRAINT smn_link_scope_team_check CHECK (
   (scope='TRANSVERSE' AND team_id IS NULL) OR
   (scope='EQUIPE' AND team_id IS NOT NULL)),
 CONSTRAINT smn_link_team_same_installation_fk FOREIGN KEY(team_id,installation_id)
   REFERENCES public.smn_team(id,installation_id) ON DELETE RESTRICT,
 CONSTRAINT smn_link_category_same_installation_fk FOREIGN KEY(category_id,installation_id)
   REFERENCES public.smn_link_category(id,installation_id) ON DELETE RESTRICT
);
CREATE INDEX smn_link_installation_scope_idx ON public.smn_link(installation_id,scope,team_id);
CREATE INDEX smn_link_category_idx ON public.smn_link(category_id);

-- Deliberately no FK to smn_link: audit survives link deletion.
CREATE TABLE public.smn_link_audit (
 id text PRIMARY KEY,
 link_id text NOT NULL,
 installation_id text NOT NULL REFERENCES public.smn_installation(id) ON DELETE RESTRICT,
 operation text NOT NULL CHECK (operation IN ('CREATE','UPDATE','DELETE')),
 before_values jsonb,
 after_values jsonb,
 actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX smn_link_audit_link_idx ON public.smn_link_audit(link_id,occurred_at);

UPDATE public.smn_installation SET schema_version=29 WHERE id='singleton' AND schema_version=28;
