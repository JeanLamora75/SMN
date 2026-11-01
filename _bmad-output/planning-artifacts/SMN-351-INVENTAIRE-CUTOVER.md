# SMN-351 — Inventaire de démantèlement et préconditions

Statut : **bascule d'interface en cours sur main — sauvegarde et restauration confirmées le 01/11/2026 ; aucun DROP SQL exécuté**.

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

## Constat PostgreSQL v33 du 01/11/2026

Diagnostic utilisateur : schéma 33, 33 migrations terminées, deux tables de valeurs candidates (`smn_sprint_story_points`, `smn_sprint_ticket_counts`), aucune dépendance SQL visible par le premier audit. Deux tables d'audit associées ont été reclassées dans les candidats. Les 26 autres objets d'abord marqués « unknown » sont des structures métier protégées KEEP. Cette absence de dépendances SQL cataloguées ne signifie **pas** absence d'appelants applicatifs : routes et composants historiques demeurent présents dans `main`.

## DROP — candidats, NON validés pour DROP SQL
- `smn_sprint_story_points`, `smn_sprint_ticket_counts`, `smn_sprint_confidence_clarity`, `smn_sprint_indicator_scores` : noms potentiels à **confirmer** par le diagnostic réel et par les dépendances d'API/tests/DDL.
- D'anciennes routes d'édition proprement indicateurs ne seront supprimables qu'après recension exhaustive des appels directs et des tests, puis validation des cas de bord.

## Critères bloquants de bascule
1. Sauvegarde de l'installation v33 et essai de restauration : **confirmés verbalement par l'utilisateur**, à distinguer d'un contrôle automatisé de restauration non effectué par ChatGPT.
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

## Bascule UI v33 — 01/11/2026

Les points d'entrée actifs de la page Sprint utilisent dorénavant la saisie universelle (`UniversalIndicatorInput`) et la projection dynamique v33 (`IndicatorReporting`). L'ancien éditeur Fxx du panneau Sprint n'est plus monté ; les colonnes Fxx et leurs lectures SQL ont été retirées de l'index Sprint, où s'affiche la projection configurée pour `cycle_list`. Le panneau des tendances anciennes n'est plus monté dans la fiche Sprint au profit de la projection `trends`. Les tests d'assertions UI historiques ont été réorientés vers ce contrat.

**Reste en place intentionnellement :** routes API et services historiques v32, fichiers de formulaires historiques non montés, lectures de snapshots de clôture pour les autres modules métier, états de capacité et de rapports. Les retirer sans audit des consommateurs et sans preuve de parité fonctionnelle casserait des contrats métiers indépendants. Le retrait physique des API/DDL demeure une phase distincte de SMN-351. Les tables n'ont pas été touchées.
