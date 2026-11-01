# SMN-351 — Inventaire de démantèlement et préconditions

Statut : **en cours — aucune suppression autorisée ni exécutée**.

## KEEP — ne jamais supprimer avec l'ancien catalogue
- Calendriers et absences, capacités et leurs ouvertures, KPI capacités, fermetures et snapshots métiers versionnés, objectifs, tickets métiers, cérémonies, historiques.
- Le catalogue dynamique v33 : `smn_indicator_definition`, `smn_indicator_team_selection`, `smn_indicator_display_preference`, `smn_indicator_manual_value`, `smn_indicator_computed_result`, `smn_indicator_dependency`, `smn_indicator_cycle_revision`, `smn_indicator_system_revision`, `smn_indicator_team_grant`.
- `src/server/sprints/indicators-read.ts` et `src/server/sprints/trends.ts` **tant que** les consommateurs de snapshots historiques et du calcul des capacités en dépendent. Ne pas confondre anciennes valeurs d'indicateurs et observations conservées dans les snapshots métier.

## ADAPT — appelants constatés sur main
- `src/server/sprints/index.ts` calcule encore F01/F04/F07/F10/F11/F12 à partir des tables historiques.
- `src/app/app/admin/sprints/sprint-index-view.tsx` affiche encore ces colonnes.
- `src/app/app/admin/sprints/[sprintId]/sprint-indicators-panel.tsx` expose encore des éditeurs historiques (SP/tickets/scores).
- `src/server/reports/standard-composition.ts`, `src/server/reports/html-preview.ts`, `src/server/sprints/trends.ts` et des rapports d'archives lisent des snapshots historiques dont l'intégrité doit être conservée.
- Les tableaux et rapports dynamiques v33 de SMN-349/350 doivent rester la projection cible ; retrait des anciens éditeurs seulement après remplacement fonctionnel sans placeholder.

## DROP — candidats, NON validés pour DROP SQL
- `smn_sprint_story_points`, `smn_sprint_ticket_counts`, `smn_sprint_confidence_clarity`, `smn_sprint_indicator_scores` : noms potentiels à **confirmer** par le diagnostic réel et par les dépendances d'API/tests/DDL.
- D'anciennes routes d'édition proprement indicateurs ne seront supprimables qu'après recension exhaustive des appels directs et des tests, puis validation des cas de bord.

## Critères bloquants de bascule
1. Sauvegarde physique de l'installation locale **effectuée et restaurée sur base jetable**, avec preuve de restauration.
2. Inventaire SQL réel, y compris FK/vues/triggers/fonctions, et appelants source/tests/exports, classé KEEP/ADAPT/DROP puis approuvé.
3. Comparaison de signatures PostgreSQL installation neuve vs migration existante (v33 et droits), et absence de divergence.
4. Tests d'intégrité métier, snapshots fermés, capacités, calendriers, Scrum/Kanban, RBAC, rapports HTML/PDF et régression.
5. Retrait des anciens API/UI sans placeholder, migration destructrice explicitement déclenchée et conditionnée, jamais automatisée silencieusement.
6. Recette locale Windows avant bascule fonctionnelle unique ; aucun héritage numérique des anciens indicateurs.

Diagnostic en **lecture seule** sur l'installation :
```powershell
pnpm exec tsx scripts/smn-351-legacy-audit.ts --check
pnpm db:diagnose
```
Ce diagnostic ne lance aucun DROP et ne change aucune préférence ni donnée métier.

Le runner BMAD `uv` n'est pas disponible dans le contexte ChatGPT ; lecture des skills et exécution via connecteurs GitHub/Jira.
