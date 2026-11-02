-- SMN-357: additive dashboard rights, independent from indicator rights.
-- No dashboard configurations are deleted when a permission is revoked.
CREATE TABLE IF NOT EXISTS public.smn_dashboard_team_grant (
 installation_id text NOT NULL,
 account_id text NOT NULL,
 team_id text NOT NULL,
 can_read boolean NOT NULL DEFAULT true,
 can_edit boolean NOT NULL DEFAULT false,
 PRIMARY KEY (installation_id,account_id,team_id),
 FOREIGN KEY (installation_id,account_id) REFERENCES public.smn_account(installation_id,id) ON DELETE CASCADE,
 FOREIGN KEY (installation_id,team_id) REFERENCES public.smn_team(installation_id,id) ON DELETE CASCADE,
 CONSTRAINT smn_dashboard_edit_requires_read CHECK (NOT can_edit OR can_read)
);
CREATE INDEX IF NOT EXISTS smn_dashboard_team_grant_team_idx
 ON public.smn_dashboard_team_grant(installation_id,team_id,account_id);
