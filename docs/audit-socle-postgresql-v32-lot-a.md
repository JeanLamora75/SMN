# Lot A — Contrat du schéma PostgreSQL v32 (audit du 29 octobre 2026)

## Référence et invariants

- Référence du socle : `prisma/migrations/20261029_smn_team_agile_mode_v32/migration.sql`.
- La base v32 utilise 32 migrations terminées, validées par `src/server/installation/diagnostic.ts`.
- `smn_team.agile_mode` est du type `text`, non nullable, contraint à `scrum` ou `kanban`.
- `smn_team.is_archived` est du type `boolean`, non nullable, valeur par défaut `false`.
- À partir de la v31, `smn_company_closure.company_id` remplace `team_id`. Les clés étrangères doivent être validées.
- Le contrôle est en lecture seule. Ne pas modifier rétroactivement le SQL des migrations v30, v31 ou v32.

## Corrections publiées

- A-01 : `src/server/db/probe.ts` inspecte les attributs et contraintes du mode Agile v32.
- A-02 : le même fichier inspecte les références et la nullabilité introduites avec le catalogue entreprise v31.
- Tests : `tests/schema-v32-structural-guards.test.ts` et `tests/schema-v32-audit-baseline.test.ts`.

## A-03 — Inventaire initial confirmé des DDL à l'exécution

| Fichier | DDL observés | Remarque |
| --- | --- | --- |
| `src/server/registries/automatic-highlights.ts` | `CREATE TABLE IF NOT EXISTS smn_automatic_highlight_settings` | Écriture de paramètres |
| `src/server/reports/templates.ts` | `CREATE TABLE IF NOT EXISTS smn_report_template`; `ALTER TABLE ADD COLUMN IF NOT EXISTS` | Gestion de modèles |
| `src/server/reports/draft-notes.ts` | `CREATE TABLE IF NOT EXISTS smn_report_draft` et `smn_report_draft_audit` | Notes de rapport |

Cet inventaire n'est pas exhaustif. Ne jamais supprimer ni déplacer un DDL à l'exécution tant que l'existant n'a pas été étudié et que la migration de remplacement n'a pas été définie, testée et exécutée sur une copie de base.

Une migration post-v32 devra :
1. Préserver les données et les contraintes existantes.
2. Vérifier la forme réelle et les variantes des tables éventuellement déjà créées.
3. Réaliser les adaptations de façon transactionnelle et journalisée.
4. Faire échouer explicitement les prérequis incompatibles.
5. Retirer le DDL à l'exécution seulement une fois la migration déployée et testée.

## A-04 — Compatibilité future

Le diagnostic autorise explicitement les versions de schéma de 1 à 32. Une migration v33 devra mettre à jour de façon coordonnée :
- la migration SQL et son script d'application ;
- le journal Prisma et les contrôles d'empreinte ;
- la liste des versions diagnostiquées et les prérequis du nouveau schéma ;
- les tests et le workflow CI.

Ne pas accepter indistinctement toute version supérieure à 32 : une version inconnue doit rester détectable.

## Vérifications restantes avant clôture du lot A

- Inventaire exhaustif des DDL dynamiques sur le dépôt, au-delà des trois fichiers ci-dessus.
- Exécution du typage, du lint et des tests en CI.
- Vérification sur une installation PostgreSQL réelle v32 (diagnostic, contraintes, scénarios sans données et avec données).
- Contrôle des règles de permissions et absence de modifications implicites au lancement.
- Revue des faux positifs et des contrôles de contraintes catalogues avant généralisation.

**État : travaux de sécurisation publiés, audit du lot A non clos.**
