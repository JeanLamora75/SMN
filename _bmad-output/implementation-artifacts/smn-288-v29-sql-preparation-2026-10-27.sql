-- PREPARATION UNIQUEMENT — NE PAS EXECUTER SUR UNE BASE UTILISATEUR.
-- Cette ébauche sera intégrée à une migration v29 versionnée seulement après
-- coordination avec probe, diagnostic, registre checksum et verrous métiers.
-- Prérequis : migration SMN-282 v28 vérifiée.

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
DO $
BEGIN
 IF to_regclass('public.smn_kanban_period') IS NOT NULL THEN
  UPDATE public.smn_team t
  SET mode_locked = true
  WHERE EXISTS (
   SELECT 1 FROM public.smn_kanban_period p WHERE p.team_id=t.id
  );
 END IF;
END $;

-- Verrou de défense en profondeur : aucune requête ne peut effacer
-- un marqueur historique ni modifier le mode après verrouillage.
CREATE FUNCTION public.smn_guard_team_agile_mode()
RETURNS trigger LANGUAGE plpgsql AS $
BEGIN
 IF OLD.mode_locked AND NOT NEW.mode_locked THEN
  RAISE EXCEPTION 'agile-mode-lock-is-permanent' USING ERRCODE='23514';
 END IF;
 IF OLD.mode_locked AND NEW.agile_mode IS DISTINCT FROM OLD.agile_mode THEN
  RAISE EXCEPTION 'agile-mode-is-locked' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $;
CREATE TRIGGER smn_guard_team_agile_mode_before_update
BEFORE UPDATE OF agile_mode,mode_locked ON public.smn_team
FOR EACH ROW EXECUTE FUNCTION public.smn_guard_team_agile_mode();


-- AVANT FINALISATION :
-- 1. Vérifier la table des périodes Kanban et les historiques supprimés.
-- 2. Ajouter le marquage atomique depuis TOUS les points de création de cycles.
-- 3. Empêcher côté base et serveur le retour mode_locked true -> false.
-- 4. Ajouter garde archive dernière active avec sérialisation par installation.
-- 5. Brancher version 29, checksum, diagnostic, sauvegarde/restauration.
-- 6. Tester sur COPIE de base Windows avant tout --apply.
