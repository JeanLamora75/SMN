-- SMN-347: additive, revocable team-scoped indicator administration.
CREATE TABLE IF NOT EXISTS public.smn_indicator_team_grant (
 installation_id text NOT NULL REFERENCES public.smn_installation(id) ON DELETE CASCADE,
 account_id text NOT NULL,
 team_id text NOT NULL,
 can_manage boolean NOT NULL DEFAULT true,
 PRIMARY KEY(installation_id,account_id,team_id),
 FOREIGN KEY(account_id) REFERENCES public.smn_account(id) ON DELETE CASCADE,
 FOREIGN KEY(team_id) REFERENCES public.smn_team(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS smn_indicator_team_grant_team_idx
 ON public.smn_indicator_team_grant(installation_id,team_id,account_id);
