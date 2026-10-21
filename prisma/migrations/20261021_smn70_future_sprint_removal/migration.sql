ALTER TABLE public.smn_sprint ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.smn_sprint ADD COLUMN IF NOT EXISTS deleted_by text REFERENCES public.smn_account(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS smn_sprint_visible_team_idx ON public.smn_sprint(team_id,start_at) WHERE deleted_at IS NULL;
