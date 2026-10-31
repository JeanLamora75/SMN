# SMN-337 — Inventaire technique et classification KEEP / ADAPT / DROP

**Responsable de l'analyse :** Winston, System Architect BMAD  
**Date :** 31 octobre 2026  
**État :** revue documentaire du dépôt `main`, sans exécution SQL ni modification applicative. **Classification conservatrice : aucune suppression autorisée à ce stade.**

## 1. Portée et méthode
- Skill confirmé : `.agents/skills/bmad-agent-architect/SKILL.md` ; personnalisation `_bmad/custom/bmad-agent-architect.toml` et référentiel UX `docs/UX-REFERENTIEL-BMAD.md` consultés. L'outil `uv`/script de résolution BMAD n'a pas été exécuté : adaptation par lecture des sources.
- Arbre GitHub complet : **3 133 entrées**, réponse REST `git/trees/main?recursive=1` **non tronquée**. Cet inventaire exhaustif de *chemins* n'est **pas** une analyse textuelle exhaustive de tous les fichiers.
- Lecture ciblée de migrations DDL, services Scrum/Kanban, rapports, contrat d'installation et API, avec recoupement de SMN-336/337 et de l'architecture publiée.
- Règle : KEEP = données métier à conserver ; ADAPT = consommateur/interface/contrat à refactoriser ; DROP-CANDIDATE = objet exclusivement ancien indicateur, suppression **conditionnelle et différée** après cartographie des FK, données, imports, usages SQL et validation explicite.

## 2. Matrice des objets SQL

| Objet physique existant | Classement | Consommateurs / preuve | Traitement avant migration |
|---|---|---|---|
| `smn_sprint_story_points`, `smn_sprint_story_points_audit` | **DROP-CANDIDATE** | `prisma/migrations/20261022_smn84_story_points/migration.sql` ; `src/server/sprints/story-points.ts`, `indicators-read.ts`, `src/app/api/admin/sprints/story-points/route.ts` | Identifier exports, snapshots et imports qui lisent ces colonnes ; capturer les dépendances avant décision de suppression |
| `smn_sprint_ticket_counts`, `smn_sprint_ticket_counts_audit` | **DROP-CANDIDATE** | `src/server/sprints/ticket-counts.ts`, `indicators-read.ts`, formulaires tickets | Vérifier d'abord les bilans, rapports et clôtures |
| `smn_sprint_scores`, `smn_sprint_scores_audit` | **DROP-CANDIDATE** | `src/server/sprints/sprint-scores.ts`, `indicators-read.ts`, indicateurs Ixx | Vérifier tout export et snapshot |
| `smn_sprint_capacity_kpi`, `smn_sprint_capacity_kpi_audit` | **KEEP jusqu'à preuve contraire** | `prisma/migrations/20261024_smn234_sprint_capacity_kpis/migration.sql` : valeurs `planned_jh`, `actual_jh` séparées des enregistrements figés du moteur de capacité ; `src/server/sprints/sprint-capacity-kpis.ts` | Décider si ces mesures J/H constituent une saisie métier de capacité, non un ancien indicateur éliminable ; aucun DROP anticipé |
| `smn_sprint_closure_snapshot`, `smn_sprint_closure_audit` | **KEEP** | `prisma/migrations/20261022_smn87_sprint_closure/migration.sql` ; lecture des snapshots dans `indicators-read.ts` | Préserver intégrité et versions Vn même si les nouvelles valeurs d'indicateurs sont éditables après clôture |
| `smn_sprint_historical_capacity`, `smn_sprint_historical_actual_capacity` et audits | **KEEP** | `src/server/sprints/sprint-capacity-kpis.ts` ; contrat d'installation | Préserver historiques et qualité/provenance |
| `smn_kanban_flow_counts`, `smn_kanban_flow_audit` | **KEEP** | `prisma/migrations/20261029_kanban_runtime_ddl/migration.sql` ; `src/server/kanban/flow-counts.ts`, `trends.ts` | Sources de flux Kanban ; adaptateur vers tags calculés, ne pas inventer métriques Scrum |
| `smn_kanban_timing`, `smn_kanban_timing_audit` | **KEEP** | `src/server/kanban/timing.ts`, `trends.ts` | Préserver conventions de jours et qualité |
| `smn_kanban_period`, `smn_kanban_closure`, `smn_kanban_capacity_opening` | **KEEP** | `prisma/migrations/20261029_kanban_runtime_ddl/migration.sql` | Conserver cycles, statut, clôture, capacités |
| `smn_kanban_render_reference`, `smn_kanban_report_analysis_choice` | **KEEP / ADAPT lecteurs** | `prisma/migrations/20261029_kanban_reporting_ddl/migration.sql` | Préserver les références et choix de rapports |
| `smn_company_capacity_recalc` | **KEEP** | `prisma/migrations/20261029_company_capacity_outbox/migration.sql` : file durable pending/running/done/failed | Recalcul de capacité distinct du recalcul d'indicateurs atomique : coexistence à tester |
| `smn_company`, `smn_company_closure`, `smn_member_absence`, calendriers et jours fériés | **KEEP** | `src/server/capacity/engine.ts` et migrations métier | Réutiliser comme sources, aucune suppression |
| `smn_capacity_initial_snapshot`, `smn_capacity_actual_snapshot`, historique de capacité | **KEEP** | Contrat d'installation et protection des snapshots | Jamais réécrire un snapshot figé pour recalculer un indicateur |
| `smn_report_pdf_archive`, `smn_report_studio_archive_snapshot`, `smn_report_document` | **KEEP** | Contrat d'installation, routes rapports | Immutabilité des archives ; refactorisation des projections uniquement |
| `smn_installation`, `smn_team`, `smn_account`, tables de droits et `_prisma_migrations` | **KEEP** | `src/server/installation/contract.ts` | Préserver sécurité, versionnement, données d'équipe |

**Important :** aucun objet DROP-CANDIDATE n'est autorisé à être supprimé par ce rapport. Les références FK, vues, fonctions, triggers, SQL construits dynamiquement et usages de snapshots exigent une preuve de compatibilité supplémentaire.

## 3. Matrice des composants TypeScript / UI

| Composant ou famille | Classement | Action |
|---|---|---|
| `src/lib/sprint-indicator-values.ts` | **ADAPT / suppression différée** | Types fixes SprintPoints/Tickets/Scores et dérivations ; remplacer les contrats côté nouveaux indicateurs, conserver les calculs métier éventuels jusqu'à inventaire d'usages |
| `src/server/sprints/story-points.ts`, `ticket-counts.ts`, `sprint-scores.ts` | **ADAPT / suppression différée** | Isoler producteurs de l'ancien indicateur et références transversales |
| `src/server/sprints/indicators-read.ts` | **ADAPT** | Remplacer projection fixe, distinguer snapshot métier et nouvelles valeurs |
| `src/server/sprints/sprint-capacity-kpis.ts` | **KEEP + ADAPT interface** | Conserver producteurs capacité indépendants ; adapter affichage uniquement si justifié |
| `src/server/sprints/trends.ts`, `src/server/kanban/trends.ts`, `src/server/reports/history-trends.ts` | **ADAPT** | Sources dynamiques, tous statuts et NULL sans zéro fictif |
| `src/app/app/admin/sprints/[sprintId]/sprint-indicators-panel.tsx` | **ADAPT / remplacer composant ancien** | Modalité groupée Cockpit Agile, nouveau catalogue ; ne pas conserver Fxx/Ixx par défaut |
| `src/app/app/admin/sprints/[sprintId]/sprint-trends-panel.tsx`, `src/app/app/admin/sprints/review/trends.tsx` | **ADAPT** | Nouveau contrat de séries et filtres |
| `src/app/app/admin/sprints/story-points-form.tsx`, `ticket-counts-form.tsx` | **ADAPT / retrait après bascule** | Formulaires fixes remplacés par saisie générique |
| `src/app/app/admin/kanban-periods/[id]/report/trends-panel.tsx` | **ADAPT** | Tendances dynamiques Kanban avec sources de flux conservées |
| Routes `/api/admin/sprints/story-points`, `/api/admin/sprints/trends`, `/api/admin/sprints/capacity-kpis` | **ADAPT** | Versionner ou remplacer contrats sans détruire les routes de capacité métier |
| Routes `/api/admin/kanban-periods/[id]/flow|timing|trends|metrics` | **KEEP + ADAPT consommateurs** | Flux/timing sont des données métier ; seule la projection des indicateurs évolue |
| Routes `/api/admin/reports/sprints/**`, `/api/admin/kanban-periods/[id]/report|pdf` | **ADAPT** | Sélection des indicateurs et sources sans altérer exports archivés |
| `src/server/capacity/engine.ts`, `actual.ts`, calendriers et fermetures | **KEEP** | Adapter contrats transactionnels si appelés depuis recalcul ; ne pas modifier la règle de calcul |
| `src/server/installation/contract.ts`, `diagnostic.ts`, `scripts/db-upgrade.ts`, baseline v32 | **ADAPT** | Mise à niveau explicite, signature physique et nouvelle baseline convergente |

## 4. Tests existants à adapter / préserver
Tests identifiés par inventaire de chemins GitHub : 
`tests/smn-153-kanban-trends.test.ts`, `smn-154-kanban-timing-trends.test.ts`, `smn-177-historical-trends.test.ts`, `smn-230-sprint-index-indicator-columns.test.ts`, `smn-234-capacity-kpis-20261024.test.ts`, `smn-234-sprint-indicators-d3.test.ts`, `smn-234-sprint-trends-d6.test.ts`, `sprint-capacity-kpi-ddl-extraction.test.ts`, `team-isolation-v30-sprint-scores.test.ts`, `v32-sprint-capacity-kpi-team-scope.test.ts`, `v32-sprint-indicator-modal-save.test.ts`, `v32-sprint-story-points-write-diagnostic.test.ts`.
**KEEP** tests de capacité, confidentialité et snapshots ; **ADAPT** assertions spécifiques aux colonnes fixes et aux anciennes projections ; ajouter les tests du moteur, du graphe, des suppressions et de la migration. Aucun test exécuté dans cette revue.

## 5. Compatibilité et verrouillage
- Des écritures existantes ouvrent leurs transactions via `BEGIN` et `COMMIT` (`src/server/kanban/flow-counts.ts`, `timing.ts`, `src/server/sprints/sprint-capacity-kpis.ts`). Avant raccordement à l'orchestrateur, proposer une variante acceptant le **même** `pg.Client` transactionnel, sans transaction autonome imbriquée.
- L'outbox persistante `smn_company_capacity_recalc` reste destinée à la capacité ; ne l'assimiler ni à un journal SQL d'indicateurs ni à un calcul d'indicateurs différé.
- Les contrats de clôture et snapshots conservent leurs versions indépendantes ; le nouveau système stocke les valeurs d'indicateurs hors snapshots figés, selon les décisions de SMN-336.
- `scripts/db-upgrade.ts` ne réalise pas automatiquement une migration historique ; définir une procédure dédiée et vérifier la compatibilité physique en base avant toute bascule.

## 6. Portes de validation à franchir avant de déclarer SMN-337 terminé
1. **Inventaire de contenus exhaustif** sur tous les fichiers suivis : usages des tables, routes, vues, fonctions, triggers, SQL dynamique, imports/exports et tests ; la revue présente prouve un inventaire de chemins non tronqué mais un contenu échantillonné.
2. **Audit PostgreSQL réel** : `pg_depend`, `pg_constraint`, `pg_trigger`, `pg_views`, `pg_proc` et données existantes ; recherche des dépendances non déclarées via SQL dynamique.
3. **Matrice consommateurs complète** par objet et une décision DROP signée/validée, avec sauvegarde restaurable avant application.
4. **Tests exécutés** sur Windows 11 et PostgreSQL pilote avec preuves ; contrôle que capacités, calendriers, historiques, Kanban et PDF archivés ne changent pas.
5. Vérifier les divergences entre baseline v32, migrations historiques et installation réelle.

## 7. Conclusion Winston
**SMN-337 : inventaire documentaire enrichi, mais non terminé selon sa définition de terminé.** La suppression destructive demeure **bloquée**. Les objets ci-dessus suffisent à orienter SMN-338 en *conception non destructive*, pas à valider un script DROP. L'analyse est fondée sur les sources du dépôt ; aucun test, migration ou audit de la base locale n'a été exécuté.
