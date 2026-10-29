-- SMN v32 : mode Agile par équipe, conservation des données de test.
ALTER TABLE public.smn_team
 ADD COLUMN IF NOT EXISTS agile_mode text;
UPDATE public.smn_team t SET agile_mode=i.mode
 FROM public.smn_installation i
 WHERE t.installation_id=i.id AND t.agile_mode IS NULL;
ALTER TABLE public.smn_team ALTER COLUMN agile_mode SET NOT NULL;
ALTER TABLE public.smn_team
 ADD CONSTRAINT smn_team_agile_mode_check CHECK (agile_mode IN ('scrum','kanban'));
UPDATE public.smn_installation SET schema_version=32
 WHERE id='singleton' AND schema_version=31;
