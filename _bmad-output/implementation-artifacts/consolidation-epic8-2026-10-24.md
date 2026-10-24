# Consolidation Epic 8 — audit et plan de recette (24/10/2026)

## Statut
**NON RECETTÉ — déploiement de l'import CSV historique sur données importantes déconseillé.**

Vérification statique à partir de la branche `main` via le connecteur GitHub, sans clone local, base de test, exécution TypeScript ni navigateur. Aucun test n'est déclaré réussi.

## Développements présents
- Stories SMN-159 à SMN-178 : modules de création et reprise historique, valeurs initiales/réelles qualifiées, imports CSV, contrôles, journal, clôtures versionnées, tendances et HTML/PDF.
- CSV : `src/lib/historical-csv-*.ts`, `src/server/historical-csv/*`, `src/app/api/admin/historical-csv/*`.
- Clôtures : `src/server/sprints/closure.ts`.
- Rapports : `src/server/reports/html-preview.ts`, `src/app/app/admin/sprints/[sprintId]/report/preview/page.tsx`.

## Risques et écarts ouverts (ne pas passer l'Epic à Terminé)
1. **Critique — transactions PostgreSQL** : vérifier réellement qu'un échec en ligne N annule toutes les écritures, audits inclus. Les tests ajoutés SMN-171/172 contrôlent principalement le texte du code.
2. **Critique — conformité du chemin d'import** : `confirm.ts` utilise des `INSERT ... ON CONFLICT DO UPDATE` sur des modèles Scrum/Kanban préexistants, sans avoir démontré la bonne interaction avec les protections et audits métier de ces modèles. Vérifier les métadonnées, contraintes et corrections simultanées.
3. **Élevé — SMN-169** : un lot rejeté affiche les erreurs, mais non un tableau ligne par ligne complet des données exploitables.
4. **Élevé — SMN-174** : l'écran des révisions couvre surtout les changements CSV ; les qualités antérieures des saisies manuelles ne sont pas consolidées dans un historique unique. La qualité précédant le premier import est inconnue, pas forcément « Non renseignée ».
5. **Élevé — SMN-175** : le cliché historique marque l'indisponibilité des six registres, mais les informations historiques qualitatives explicitement retrouvées demandent une voie de restitution attestée.
6. **Élevé — SMN-177/178** : seules les qualités CSV de sources importées sont intégrées dans certaines projections ; éviter d'assimiler « non attestée » à une donnée `known`. Vérifier l'ensemble des sections du rapport historique et les méta-données des versions.
7. **Moyen — i18n** : plusieurs textes récemment ajoutés dans l'administration sont codés en français au lieu d'utiliser le catalogue FR/EN.

## Portes de validation (ordre recommandé)
1. **Compilation/typage** : `pnpm typecheck`, `pnpm build`.
2. **Tests unitaires ciblés** : `pnpm exec tsx --test tests/smn-159-historical-sprint.test.ts tests/smn-160-historical-ceremonies.test.ts tests/smn-161-historical-events.test.ts tests/smn-162-historical-partial.test.ts tests/smn-163-historical-capacity.test.ts tests/smn-164-historical-actual-capacity.test.ts tests/smn-166-historical-csv-contract.test.ts tests/smn-167-historical-csv-validation.test.ts tests/smn-168-historical-csv-business.test.ts tests/smn-169-historical-csv-preview.test.ts tests/smn-170-historical-csv-preservation.test.ts tests/smn-171-historical-csv-confirmation.test.ts tests/smn-172-historical-csv-atomic.test.ts tests/smn-173-historical-csv-attempts.test.ts tests/smn-174-historical-revisions.test.ts tests/smn-175-historical-partial-closure.test.ts tests/smn-176-historical-closure-versions.test.ts tests/smn-177-historical-trends.test.ts tests/smn-178-historical-report.test.ts`.
3. **Recette DB isolée** : créer deux cycles historiques de test, import valide multi-métriques (Scrum et Kanban séparément), comparer valeurs et qualités ; tester CSV incorrect, doublon, métrique étrangère, cycle absent, cycle clôturé, modification concurrente, panne à la seconde écriture et confirmer zéro modification après rollback. Restaurer la base de test après chaque cas.
4. **Recette V1/V2** : clôture V1 partielle -> rouvrir -> corriger -> clôture V2, confirmer que V1 et PDF V1 restent byte-à-byte inchangés et que V2 comporte les nouvelles informations avec dates actuelles de clôture.
5. **Recette de confidentialité et UX** : accès administrateur versus utilisateur lecture seule, erreur détaillée par ligne, identifiants de cycles, qualités non attestées, PDF exclusivement après export explicite.
6. **Validation fonctionnelle** : vérifier chaque AC de SMN-159 à SMN-178 et enregistrer la preuve avant transition Jira.

## Décision
Ne pas modifier les statuts Jira avant résultats reproductibles. GitHub `main` reste le référentiel de code. Ce document est un audit de consolidation, non un procès-verbal de recette.
