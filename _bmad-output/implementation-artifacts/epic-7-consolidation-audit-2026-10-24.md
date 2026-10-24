# Epic 7 Kanban — consolidation technique et fonctionnelle
Date : 2026-10-24
Références : Jira SMN-136 à SMN-158 ; GitHub main.
Statut : audit statique ciblé, sans exécution du build, des tests ni recette PostgreSQL.

## Règle d'avancement
Les modifications publiées sur main ne suffisent pas à déclarer les stories « terminées ». Toute clôture de story nécessite une preuve de compilation, tests pertinents et recette des critères.

## Écarts prioritaires constatés
1. **P0 — SMN-155, SMN-158 : clôture et rapports incomplets.** Le cliché `smn_kanban_closure` conserve objectifs/flux/durées et une ouverture de capacité, mais les liens qualitatifs et événements portent explicitement `not-integrated`. La capacité réelle retenue du moteur commun n'est pas figée dans le cliché. Aucun export final Kanban vers `storeFinalPdfArchive` n'est raccordé. Correctif appliqué : refuser la préparation d'un rapport clôturé sans cliché plutôt que de reconstruire une fausse photographie à partir de données courantes.
2. **P0 — SMN-152 : capture initiale Kanban incomplète.** `reconcileKanbanStates` inscrit un marqueur `pending-capture` avec `initial_jh=NULL` ; aucun déclenchement confirmé de `openCapacityPeriod` à l'ouverture Kanban. Ne jamais reconstruire rétroactivement une initiale historique.
3. **P1 — SMN-157 : occurrences Kanban absentes.** En mode Kanban, `/api/team-calendar/meetings` renvoie actuellement `meetings:[]` ; il empêche les faux événements Scrum, mais ne restitue pas encore les réunions Kanban réellement configurées. Le formulaire de création actuel dépend d'un `sprintId`.
4. **P1 — SMN-144/145/146/156 : replanification partielle.** Les métriques et objectifs sont préservés ; le recalcul sélectif des occurrences futures et la qualité des références de capacité après correction ne sont pas raccordés. L'aperçu signale les cinq mesures et objectifs, mais ne prouve pas le respect intégral des événements/références qualitatives.
5. **P1 — SMN-147/151 : cohérence des blocs.** La sauvegarde des cinq métriques est atomique ; l'édition de capacité Kanban proprement dite et les avertissements de sortie sur les navigations programmatiques restent à valider. Les tendances sont des lectures séparées et doivent être testées avec des versions clôturées historiques.
6. **P1 — intégrité et sûreté technique.** Les méthodes `ensure...Schema` effectuent des DDL à la lecture, et plusieurs lectures déclenchent la réconciliation des états. À revoir pour distinguer migrations, lectures sans mutation, et transitions de cycle. Examiner la prise des verrous PostgreSQL dans l'ordre identique entre replanification, clôture et réconciliation pour éliminer les risques de deadlock.
7. **P1 — validation.** Aucun `pnpm build` ni suite complète de tests Epic 7 exécuté dans cette session. Revoir le rendu FR/EN, l'absence de fuite d'informations nominatives et le traitement des champs vides vs zéro.

## Ordre de consolidation recommandé
C1. Réconciliation des statuts, événements réels Kanban et capture d'ouverture J/H idempotente.
C2. Clôture transactionnelle et clichés Vn complets, immuables et compatibles avec les historiques qualitatifs.
C3. Rapport Kanban HTML structuré et export PDF exact via le moteur et l'archive partagés.
C4. Replanification : impacts, conflits et recalculs permis uniquement pour références calculables.
C5. Tests automatisés + validation manuelle des rôles, des dates, des valeurs inconnues, de la stabilité des versions et des anciens PDF.

## Vérification
```powershell
pnpm exec tsx --test tests/smn-1{36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58}-*.test.ts
pnpm build
```
Note : la commande glob ci-dessus est indicative et n'est pas directement adaptée à PowerShell ; exécuter les fichiers de test existants par liste explicite ou avec un script du dépôt. Ne pas attribuer un résultat aux tests avant exécution.

## Décision
Epic 7 : développement engagé, non validé, non clôturé. Les stories Jira restent à leur statut existant jusqu'à recette.
