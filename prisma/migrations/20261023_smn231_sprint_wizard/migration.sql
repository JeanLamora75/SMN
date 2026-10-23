-- Assistant de génération : les aperçus ne créent pas de sprint.
-- Les jetons sont propres à l'équipe et à l'initiateur, expirent et sont consommés.
CREATE TABLE IF NOT EXISTS public.smn_sprint_wizard_preview (
 token text PRIMARY KEY,
 team_id text NOT NULL REFERENCES public.smn_team(id) ON DELETE RESTRICT,
 actor_id text NOT NULL REFERENCES public.smn_account(id) ON DELETE RESTRICT,
 request jsonb NOT NULL,
 digest text NOT NULL,
 expires_at timestamptz NOT NULL,
 consumed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS smn_sprint_wizard_preview_expiry_idx
 ON public.smn_sprint_wizard_preview(expires_at)
 WHERE consumed_at IS NULL;

-- Ne pas confondre les réunions reconstituées avec une déclaration de tenue réelle.
ALTER TABLE public.smn_sprint_ceremony
 ADD COLUMN IF NOT EXISTS generation_source text NOT NULL DEFAULT 'standard';
ALTER TABLE public.smn_scrum_template_occurrence
 ADD COLUMN IF NOT EXISTS generation_source text NOT NULL DEFAULT 'standard';
