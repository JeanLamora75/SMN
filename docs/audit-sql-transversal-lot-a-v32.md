# SMN — Audit SQL transversal du lot A (29 octobre 2026)

## Conclusion

**Audit d'inventaire terminé ; clôture technique globale du lot A NON acquise.**
L'analyse automatique sur `main` (GitHub Actions n° 40937809259, commit
`3928679771236585fc8fb3d0dc3a91754c945b9a`) a parcouru **1 417 fichiers
éligibles** et repéré **636 occurrences lexicales SQL DDL**, tous emplacements
confondus. Parmi elles, **81 occurrences potentielles dans 40 fichiers
`src/server/` hors fichiers `*-migration.ts`**, avant correction du
dernier `CREATE UNIQUE INDEX` du service des documents Rapports (commit
`54fb3aa402093832fc6e286037242048c76602f4`).

Ces décomptes sont des **candidats lexicaux**, pas 81 exécutions avérées.
Certains sont des références textuelles à une migration, notamment
`src/server/installation/install.ts`. Les DDL assemblés dynamiquement
peuvent ne pas apparaître dans la recherche.

## Échantillons vérifiés par lecture des chemins d'exécution

| Domaine | Fichier | Preuve et action |
| --- | --- | --- |
| Briefs IA | `src/server/ai-briefs/responses.ts` | `ensureResponseSchema` exécute `CREATE TABLE` et plusieurs `ALTER TABLE`. Migration explicite requise. |
| Briefs IA | `src/server/ai-briefs/archive.ts` | Définition d'archive et `ALTER TABLE` à l'exécution. Migration explicite requise. |
| Kanban | `src/server/kanban/periods.ts` | `ensureKanbanPeriodTables` exécute `CREATE TABLE`, `ALTER TABLE` et `CREATE INDEX`. Migration explicite requise. |
| Scrum / Sprint | `src/server/sprints/creation.ts` | `ensureSprintSchema` crée les tables Sprint et audit. Migration versionnée requise, avec attention à la première installation. |
| Tableau de bord | `src/server/dashboard/notes.ts` | Création de tables de notes et d'historique lors d'écritures. Migration explicite requise. |
| Capacité | `src/server/capacity/company-recalc-outbox.ts` | Table de file et index créés depuis le service. Migration explicite requise. |
| Rapports | `src/server/reports/report-documents.ts` | Dernier `CREATE UNIQUE INDEX` dynamique identifié puis déplacé derrière une vérification d'existence ; sa définition figure déjà dans `scripts/apply-report-schema-v32.ts`. |
| Installation | `src/server/installation/install.ts` | Références littérales `CREATE TABLE` utilisées pour sélectionner les définitions des modèles Scrum ; à classer comme référence de migration et non comme mutation SQL directe. |

## Fichiers candidats, par sous-ensemble (inventaire CI)

- **Kanban** : `periods.ts`, `states.ts`, `cadence.ts`, `flow-counts.ts`,
  `goals.ts`, `qualitative.ts`, `timing.ts`, `batch-create.ts`,
  `closure.ts`, `meetings.ts`, `render-reference.ts`,
  `report-analysis-choices.ts`.
- **Scrum / Sprints** : `historical-events.ts`, `transitions.ts`,
  `closure.ts`, `creation.ts`, `deletion.ts`, `goals.ts`,
  `historical-actual-capacity.ts`, `historical-capacity.ts`,
  `review-analysis.ts`, `sprint-capacity-kpis.ts`, `sprint-scores.ts`,
  `story-points.ts`, `ticket-counts.ts`, `historical-create.ts`,
  `historical-partial.ts`, `wizard.ts`.
- **Briefs IA** : `archive.ts`, `duplicates.ts`, `human-analyses.ts`,
  `responses.ts`, `templates.ts`.
- **Autres** : `dashboard/notes.ts`, `dashboard/event-edit.ts`,
  `historical-csv/confirm.ts`, `historical-csv/attempts.ts`,
  `capacity/company-recalc-outbox.ts`, `installation/install.ts`.
- **Rapports** : `report-documents.ts` — dernier DDL corrigé.

## Couverture vérifiée du lot A

- Modules **Registres, Rapports, Équipes, Membres, Calendrier, Cérémonies** :
  migrations ciblées, garde-fous statiques et tests dédiés publiés.
- Dernière CI I0 **verte avant cet audit** : exécution
  [40934424608](https://github.com/JeanLamora75/SMN/actions/runs/40934424608).
- Le workflow **SMN — Inventaire SQL DDL v32** est exécuté avec succès.
  `scripts/audit-runtime-ddl-v32.ts` publie désormais les candidats
  `schema-v32-runtime-candidates.md/json`, lignes et fichiers inclus.
- **Aucune preuve de recette de migration sur une copie de la base locale v32
  contenant toutes les données historiques**. Ne pas lancer les scripts
  différés sur la base utilisateur sans sauvegarde et procédure de reprise.

## Priorisation et conditions de clôture

1. P0 : extraire les DDL encore exécutés dans les **Sprints**, **Kanban**,
   **Dashboard** et les **Briefs IA**, sans modifier les migrations déjà appliquées.
2. P0 : couvrir la première installation et les installations migrées,
   avec migration explicite, contrôle des contraintes, rollback et idempotence.
3. P1 : traiter les files de recalcul, imports historiques et les
   dépendances transitives restantes ; classifier chaque faux positif.
4. P1 : ajouter un seuil CI de **zéro nouveau DDL non autorisé** puis de
   zéro DDL métier réel après assainissement.
5. P0 : valider Windows, PostgreSQL Linux, sauvegarde/restauration,
   migration d'une copie historique v32 et la recette des parcours métier.

**Statut : audit transversal réalisé et écarts identifiés ; lot A global
encore ouvert.** Les captures chiffrées concernent le commit audité, pas
une affirmation de zéro DDL au HEAD après corrections.
