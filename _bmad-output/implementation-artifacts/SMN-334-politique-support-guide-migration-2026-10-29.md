# SMN-334 — Politique de support des schémas et guide de migration

Date : 29 octobre 2026 — BMAD v6.12.4 — Références : SMN-326, SMN-327 à SMN-334.

## 1. Règles de compatibilité

La source de vérité pour les capacités est `src/server/schema/compatibility.ts` : `CURRENT_SCHEMA_VERSION = 32`. Le contrôle de structure est `src/server/schema/integrity.ts` et les diagnostics se trouvent sous `src/server/installation/` et `src/server/db/probe.ts`. Une borne numérique seule n'atteste **jamais** l'intégrité d'une installation.

| Version | Lecture fonctionnelle | Politique |
| --- | --- | --- |
| 32 | Schéma courant ciblé | Exécution autorisée seulement si migration enregistrée, empreinte et structure requise valides |
| 31 | Version de départ pour v32 | Migration explicite vers v32, après sauvegarde et vérifications ; pas de migration à la lecture |
| 30 | Version historique consolidée | Conserver les voies compatibles existantes ; ne pas déprécier sans parcours de migration démontré |
| 29 | Version historique Liens | Idem ; la capacité Liens dépend de son intégrité vérifiée |
| 28 | Première version multiéquipes | Idem ; isolation et autorisations serveur obligatoires |
| 1 à 27 | Historique monoéquipe | Les adaptateurs existants sont conservés tant qu'une migration attestée n'est pas disponible |
| >32 ou version incohérente | Inconnue ou invalide | Refus explicite, aucune réparation automatique |

Cette matrice est une **politique** et non une déclaration de certification de chaque version. Le support et les autorisations effectifs se déterminent dans le code et les tests exécutés.

Capacités actuellement enregistrées : `multi-team` (v28), `links` (v29), `country-consolidation` (v30), `company-catalog` (v31), `per-team-agile-mode` (v32). Les exigences exactes de tables, colonnes, contraintes, migration et checksum sont celles de `schema/integrity.ts`.

## 2. Procédure standard vN → vN+1

### A. Préparation et impact

1. Ouvrir une Story Jira et préparer l'ADR et le contrat BMAD ; inventorier les API, services, requêtes, tables, contraintes, données historiques et consommateurs de rapports concernés.
2. Vérifier l'état réel via `pnpm db:diagnose` et journaliser la version, la migration cible et l'état initial. Refuser les états `schema-incompatible` ou `installation-incomplete` avant toute écriture.
3. Sauvegarder la base complète, le journal `_prisma_migrations`, les métadonnées et les paramètres. Vérifier qu'une restauration isolée fonctionne. Ne jamais conserver les identifiants en clair dans GitHub.
4. Comparer les règles et capacités en vigueur ; identifier les adaptations legacy nécessaires, les modifications d'API et les impacts sur l'isolation des équipes.
5. Préparer des données représentatives, dont Scrum Koala avec ses cycles et Kanban Panda, ainsi que des équipes vides, archivées et verrouillées par l'historique.

### B. Écriture et application contrôlée

1. Créer une migration SQL versionnée **additive lorsque possible**, accompagnée d'un script d'application explicite ; ne pas modifier une migration déjà exécutée en production.
2. Préconditions : version N initialisée, toutes les migrations précédentes terminées, checksum conforme, structure connue, verrou transactionnel, sauvegarde validée. Refuser un état divergant.
3. Exécuter la migration dans une transaction PostgreSQL quand les opérations le permettent ; vérifier version N+1, contraintes, colonnes, intégrité et données métier **avant COMMIT**, enregistrer la migration, puis COMMIT. En cas d'erreur, ROLLBACK.
4. Les migrations non transactionnelles exigent un plan spécifique avec points de reprise, maintenance et restauration ; elles ne peuvent emprunter silencieusement le chemin standard.
5. Mettre à jour le registre central et les exigences physiques, puis les adaptateurs historiques explicitement documentés. Aucune route `GET`, authentification ou diagnostic ne doit créer une table ou migrer une installation.

### C. Validation obligatoire

- **Compatibilité technique** : tests statiques SMN-332, TypeScript, lint, build et tests CI Windows/Linux, PostgreSQL 18.
- **Migration** : reproduction sur une **copie complète vN**, exécution du vrai script, comparaison des données avant/après, test rollback, détection d'une migration partiellement enregistrée et refus d'une vN+1 incomplète.
- **Autorisation et isolation** : login et rôles Admin/user ; absence d'accès à une autre équipe via `teamId` forgé ; Team Koala Scrum / Team Panda Kanban, modes et archivage, création et édition d'équipe vide, refus de changer le mode d'une équipe ayant des cycles.
- **Fonctionnel** : contexte Sprint, cadence et périodes Kanban, calendrier, absences, capacités, rapports, paramètres et diagnostics ; préserver leurs contrats HTTP publics.
- **Lecture seule** : interdire DDL et écritures cachées lors des lectures, dont les fonctions `ensure*` et `reconcile*`.
- **Observabilité** : journal de migration et diagnostic cohérents, logs exploitables sans secrets.
- **Critère de clôture** : preuves GitHub Actions sur le SHA livré, tests PostgreSQL de bout en bout et compte rendu daté ; aucune Story ne passe « Terminé » si un contrôle obligatoire est rouge ou absent.

### D. Repli et récupération

**Avant COMMIT** : `ROLLBACK`, vérifier version N et conservation des lignes, ne pas relancer automatiquement. **Après COMMIT** : ne pas décrémenter `schema_version` manuellement ni supprimer à l'aveugle les nouvelles colonnes. Stopper les écritures applicatives, sauvegarder l'état défaillant à titre d'analyse et restaurer la sauvegarde testée dans un environnement maîtrisé, avec contrôle du journal et de la cohérence des données. Si des écritures post-migration ont eu lieu, définir explicitement la stratégie de réconciliation et de perte de données avant restauration.

## 3. Dépréciation d'une version ancienne

Une version N ne devient dépréciable que si : un chemin versionné N→…→version courante existe ; ses sauvegardes et restaurations ont été testées ; les tests d'intégration sur une copie représentative sont réussis ; les API et utilisateurs impactés ont un plan de transition ; la décision est documentée dans ADR/Jira et validée. Un support historique présent dans le code ne doit pas être supprimé sur la seule base de l'âge d'une version.

## 4. Application au passage v31 → v32

Migration versionnée : `prisma/migrations/20261029_smn_team_agile_mode_v32/migration.sql` ; application **explicite** : `pnpm exec tsx scripts/apply-team-agile-mode-v32.ts --apply` après sauvegarde et diagnostic. Ajouter `agile_mode` par équipe et `is_archived`, conserver les cycles Scrum/Kanban, vérifier le journal, les contraintes et l'état après migration avec `pnpm db:diagnose`.

**Limite actuelle vérifiée dans le dossier SMN-333** : les premiers tests ont utilisé des fixtures partielles de v31 ; la certification de la migration d'une copie complète v31, des API de login, du calendrier et des rapports n'est pas encore attestée dans ce document. Ne pas considérer la procédure v31→v32 comme certifiée sur une base personnelle à ce stade.

## 5. Modèle de fiche de preuve pour chaque nouvelle migration

Indiquer : ticket Jira, numéro et empreinte de migration, commit GitHub, sauvegarde/restauration de test, inventaire des données avant/après (quantités et invariants), résultats TypeScript/lint/build, CI SHA et liens, tests PG18 de sécurité et isolation, diagnostics avant/après, anomalies et décisions de repli, approbation fonctionnelle, décision de support/dépréciation.

Références : `_bmad-output/planning-artifacts/architecture/ADR-SMN-SCHEMA-COMPATIBILITY-CENTRALISEE-2026-10-29.md` ; `_bmad-output/implementation-artifacts/SMN-333-integration-v31-v32-2026-10-29.md`.
