-- MIGRATION NON ACTIVEE : ne pas appliquer avant coordination diagnostic v29,
-- creation des cycles, protections d'archivage et recette sur copie.
ALTER TABLE public.smn_team
  ADD COLUMN agile_mode text,
  ADD COLUMN is_archived boolean NOT NULL DEFAULT false,
  ADD COLUMN mode_locked boolean NOT NULL DEFAULT false;

-- Les équipes historiques héritent du mode d'installation lorsqu'il est fiable.
-- Scrum constitue le secours lorsque ce mode est absent ou inconnu.
UPDATE public.smn_team t
SET agile_mode = CASE
  WHEN lower(btrim(i.mode)) IN ('scrum','kanban') THEN lower(btrim(i.mode))
  ELSE 'scrum'
END
FROM public.smn_installation i
WHERE i.id = t.installation_id;

ALTER TABLE public.smn_team
  ALTER COLUMN agile_mode SET NOT NULL,
  ADD CONSTRAINT smn_team_agile_mode_check
    CHECK (agile_mode IN ('scrum','kanban'));

-- Sprint existant = mode définitivement verrouillé même si le sprint
-- est supprimé logiquement (deleted_at non pris en compte).
UPDATE public.smn_team t
SET mode_locked = true
WHERE EXISTS (
 SELECT 1 FROM public.smn_sprint s WHERE s.team_id=t.id
);

-- Les périodes Kanban existent dans certaines installations seulement :
-- leurs tables sont créées dynamiquement par le module Kanban.
DO $$
BEGIN
 IF to_regclass('public.smn_kanban_period') IS NOT NULL THEN
  UPDATE public.smn_team t
  SET mode_locked = true
  WHERE EXISTS (
   SELECT 1 FROM public.smn_kanban_period p WHERE p.team_id=t.id
  );
 END IF;
END $$;

-- Verrou de défense en profondeur : aucune requête ne peut effacer
-- un marqueur historique ni modifier le mode après verrouillage.
CREATE FUNCTION public.smn_guard_team_agile_mode()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.mode_locked AND NOT NEW.mode_locked THEN
  RAISE EXCEPTION 'agile-mode-lock-is-permanent' USING ERRCODE='23514';
 END IF;
 IF OLD.mode_locked AND NEW.agile_mode IS DISTINCT FROM OLD.agile_mode THEN
  RAISE EXCEPTION 'agile-mode-is-locked' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER smn_guard_team_agile_mode_before_update
BEFORE UPDATE OF agile_mode,mode_locked ON public.smn_team
FOR EACH ROW EXECUTE FUNCTION public.smn_guard_team_agile_mode();



-- Le verrouillage d'un cycle doit être atomique avec son insertion.
-- Un déclencheur prend un verrou de ligne sur son équipe parente ; une édition
-- concurrente du mode ne peut ainsi contourner la première création.
CREATE FUNCTION public.smn_lock_team_agile_on_cycle()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
 expected_mode text := TG_ARGV[0];
BEGIN
 UPDATE public.smn_team
 SET mode_locked=true
 WHERE id=NEW.team_id AND agile_mode=expected_mode AND is_archived=false;
 IF NOT FOUND THEN
  RAISE EXCEPTION 'team-unavailable-for-cycle' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;

CREATE TRIGGER smn_sprint_lock_team_agile
BEFORE INSERT ON public.smn_sprint
FOR EACH ROW EXECUTE FUNCTION public.smn_lock_team_agile_on_cycle('scrum');

-- La table des périodes Kanban peut être créée plus tard par le serveur.
DO $$
BEGIN
 IF to_regclass('public.smn_kanban_period') IS NOT NULL THEN
  EXECUTE 'CREATE TRIGGER smn_kanban_period_lock_team_agile
   BEFORE INSERT ON public.smn_kanban_period
   FOR EACH ROW EXECUTE FUNCTION public.smn_lock_team_agile_on_cycle(''kanban'')';
 END IF;
END $$;
