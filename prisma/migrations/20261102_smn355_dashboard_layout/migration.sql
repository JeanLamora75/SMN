-- SMN-355: additive and non-destructive; does not change schema_version 33.
CREATE TABLE IF NOT EXISTS public.smn_dashboard_layout (
 installation_id text NOT NULL REFERENCES public.smn_installation(id) ON DELETE CASCADE,
 account_id text NOT NULL REFERENCES public.smn_account(id) ON DELETE CASCADE,
 team_id text NOT NULL REFERENCES public.smn_team(id) ON DELETE CASCADE,
 schema_version integer NOT NULL DEFAULT 1 CHECK (schema_version > 0),
 revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
 layout jsonb NOT NULL CHECK (jsonb_typeof(layout)='object'),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (installation_id,account_id,team_id),
 FOREIGN KEY (installation_id,account_id) REFERENCES public.smn_account(installation_id,id),
 FOREIGN KEY (installation_id,team_id) REFERENCES public.smn_team(installation_id,id)
);
CREATE INDEX IF NOT EXISTS smn_dashboard_layout_team_idx ON public.smn_dashboard_layout(installation_id,team_id);
