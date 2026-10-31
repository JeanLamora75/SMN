# SMN — Revue technique du dépôt avant documentation / migration
Statut : lecture seule ; revue ciblée, **non exhaustive**, 31/10/2026.

## Éléments vérifiés dans GitHub
- `_bmad/bmm/config.yaml`, `_bmad/core/config.yaml` : configuration BMAD v6.12.4, langue française, `_bmad-output/planning-artifacts`.
- `_bmad-output/planning-artifacts/SMN-IND-SPEC-001.md` : spécification existante, IND-16 n'admet que les quatre opérations arithmétiques ; cet écart avec ARCH-03.4 option C est traité dans l'avenant.
- `package.json` : Next.js 16, TypeScript 5.9, Prisma 7, PostgreSQL `pg`, pnpm 12.10.0. Aucune dépendance décimale spécialisée déclarée directement.
- `pnpm-lock.yaml` : aucune occurrence identifiée de `decimal.js`, `big.js`, `bignumber.js` dans le contenu inspecté.
- `src/lib/sprint-indicator-values.ts` : anciennes structures et calculs points/tickets/scores.
- `src/server/sprints/indicators-read.ts` : lecture indicateurs/snapshots de clôture.
- `src/server/sprints/sprint-capacity-kpis.ts` : tables `smn_sprint_capacity_kpi`, `smn_sprint_capacity_kpi_audit` et accès capacité.
- `src/server/kanban/flow-counts.ts` : tables `smn_kanban_flow_counts`, `smn_kanban_flow_audit`, et transaction ouverte par `BEGIN` dans la sauvegarde.
- `src/server/kanban/trends.ts` : dépendances aux tables de flux et timing Kanban.
- `src/server/capacity/engine.ts` : service capacité utilisant `pg.Client` et dépendant des calendriers / affectations.
- `scripts/db-upgrade.ts` : stratégie de versionnement native v32, pas de migration historique automatique.
- `scripts/generate-v32-baseline.ts` et `src/server/installation/native-v32.ts` : génération et validation de la baseline native v32.

## Recommandations arrêtées
**Données SQL** : classifier exhaustivement les objets avant suppression. Préserver les capacités et snapshots métier ; ne jamais DROP `smn_sprint_capacity_kpi` ou `smn_kanban_flow_counts` sans classification et dépendances prouvées.

**Transactions** : le service propriétaire ouvre la transaction et prend les verrous dans un ordre commun, l'orchestrateur réutilise le même client `pg`. Les services ouvrant eux-mêmes BEGIN doivent fournir une variante acceptant un client transactionnel externe, sans BEGIN/COMMIT/ROLLBACK autonome. Tester l'atomicité calendriers + indicateurs.

**Décimales** : choix de principe d'une bibliothèque spécialisée derrière `DecimalEngine`. `decimal.js` est candidat à vérifier pour puissance non entière, HALF_UP, limites numériques, maintenance, licence et compatibilité Node/TypeScript ; aucun choix définitif de version ni installation effectué.

**BMAD** : les fichiers de configuration et le dossier d'artefacts sont vérifiés. Plusieurs chemins usuels d'agent/workflow d'architecture ont renvoyé 404 ; le workflow exact n'a pas été identifié. Ces documents sont des livrables de conception alignés sur le dossier BMAD, **pas la preuve d'exécution du workflow officiel**.

## Limites de l'audit
Le connecteur de recherche GitHub n'a retourné aucun résultat même pour des chaînes présentes dans les fichiers consultés : une recherche de code exhaustive ne peut donc être affirmée. Aucun scan complet de tous les DDL, imports, migrations, tests et rapports n'a été effectué. Aucune exécution locale de tests, de bases, de commandes BMAD ou de migration.

## Critères à satisfaire avant développement/migration
Inventaire exact des anciens objets SQL, plan de compatibilité des API et exports, identification des tags calendaires réels, vérification de la coordination transactionnelle et de l'ordre des verrous, qualification de la bibliothèque décimale, tests Windows 11/PostgreSQL et calibrage des budgets. Ces réserves **ne bloquent pas la publication d'une architecture de conception**, mais interdisent de la présenter comme déjà intégrée ou testée.
