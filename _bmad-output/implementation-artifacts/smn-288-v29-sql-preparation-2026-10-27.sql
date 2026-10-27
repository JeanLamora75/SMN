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

-- AVANT FINALISATION :
-- 1. Vérifier la table des périodes Kanban et les historiques supprimés.
-- 2. Ajouter le marquage atomique depuis TOUS les points de création de cycles.
-- 3. Empêcher côté base et serveur le retour mode_locked true -> false.
-- 4. Ajouter garde archive dernière active avec sérialisation par installation.
-- 5. Brancher version 29, checksum, diagnostic, sauvegarde/restauration.
-- 6. Tester sur COPIE de base Windows avant tout --apply.
