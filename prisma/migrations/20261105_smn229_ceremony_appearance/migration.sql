-- SMN-229 : apparence facultative des modèles de cérémonies, v33 additive et idempotente.
ALTER TABLE public.smn_scrum_ceremony_template
 ADD COLUMN IF NOT EXISTS icon_name text,
 ADD COLUMN IF NOT EXISTS icon_color text;
-- La validation détaillée des noms officiels Bootstrap se fait côté serveur.
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='smn_ceremony_icon_color_chk') THEN
  ALTER TABLE public.smn_scrum_ceremony_template
   ADD CONSTRAINT smn_ceremony_icon_color_chk
   CHECK (icon_color IS NULL OR icon_color IN ('blue','teal','green','amber','orange','red','purple','pink','slate'));
 END IF;
END $$;
