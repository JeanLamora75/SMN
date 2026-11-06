# SMN — Fiche sprint / Capacité — Colonne absences par membre

**Date :** 06/11/2026 · **Agent :** Amelia (BMAD, exécution adaptée via connecteur GitHub) · **Statut :** code publié, tests d'exécution et recette à réaliser.

## Demande métier
Ajouter **Absences (J/H)** entre « Présence (J/H) » et « Développement (J/H) » dans la table « Présence des membres pendant le Sprint ». Chaque cellule montre un nombre en jours-homme (une demi-journée = 0,5 J/H). L'infobulle au survol de l'ensemble de la cellule ou son focus clavier montre la date, la durée, la catégorie, le type planifié/imprévu et le motif disponible.

## Règles de comptage
- Réutiliser les **données du moteur de capacité** et les périodes d'affectation du membre à l'équipe; ne pas recréer un calcul métier côté React.
- Compter les demi-journées d'absence qui intersectent les créneaux de travail configurés pour le membre dans le sprint, **sur jours de semaine uniquement** et hors jours fériés du pays effectif et fermetures d'entreprise; une demi-journée ne peut être comptabilisée plusieurs fois si des périodes se chevauchent.
- Les annulations/suppressions historisées ne sont pas retenues (filtre SQL du moteur existant). Les absences planifiées et imprévues sont incluses.
- Le total et les lignes de l'infobulle sont produits depuis la même liste de jours admissibles.
- En l'absence de données déterminables, afficher **« Non disponible »**, jamais zéro implicite. Un zéro confirmé est affiché « 0 J/H ».
- Respecter les autorisations de lecture nominative déjà présentes sur la page : aucun accès nouveau ni endpoint d'absence public.
- **Sprint clôturé :** lire l'instantané versionné, sans recalculer les absences à partir du calendrier actuel. Les anciens instantanés dépourvus du détail continuent d'être valides; seule leur nouvelle colonne affiche « Non disponible ».

## Fichiers / architecture
- `src/server/capacity/absence-projection.ts` — sélection des jours ouvrés et de demi-journées non dupliquées.
- `src/server/capacity/engine.ts` — enrichissement des jours calculés avec les absences valides et leur catégorie/motif, en conservant le périmètre équipe.
- `src/lib/sprint-presence.ts` — projection par membre `absenceJh` et `absences`, lecture d'instantané rétrocompatible.
- `src/app/app/admin/sprints/[sprintId]/sprint-capacity-panel.tsx` — colonne et infobulle FR/EN sur cellule complète, focus clavier.
- `tests/sprint-presence-absences-column.test.ts` — tests ajoutés pour demi-journées, exclusions, doublons, snapshots et positionnement du tableau.

## Vérifications et limites
Relecture des fichiers publiés via GitHub et contrôles statiques ciblés : **13/13 positifs**. Aucun test automatisé, `pnpm typecheck`, `pnpm lint`, essai PostgreSQL ni recette dans un navigateur n'a été **exécuté** lors de cette session. Les statuts CI interrogés n'ont retourné aucun résultat; ceci ne prouve ni succès ni échec. Tester particulièrement sur Windows la table responsive, les dates locales et les rapports déjà clôturés avant validation définitive.

**Tests proposés :** `pnpm exec tsx --test tests/sprint-presence-absences-column.test.ts` puis `pnpm typecheck` et `pnpm lint`, et une validation visuelle sur un sprint comprenant absences planifiées, imprévues, demi-journées et jour férié.
