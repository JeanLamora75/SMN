# SMN-329 — Intégrité physique et journal des migrations

Date : 29 octobre 2026 — Implémentation publiée sur `main` ; **validation d'intégration non effectuée**.

## Exigence
À version déclarée égale, une installation dont les objets ou migrations sont incomplets ne doit pas être considérée compatible. Aucune API en lecture ne lance de DDL ni de migration implicite.

## Implémentation
- `src/server/schema/integrity.ts` : registre de prérequis par capacité SMN-328 (tables, colonnes, contraintes, migration), évaluation déterministe `assessSchemaIntegrity`, interrogation en lecture seule `inspectSchemaCapability` et `requireSchemaCapability`.
- Vérification de `public.smn_installation` et de l'état `initialized`, refus des versions futures via `evaluateSchemaCapability`.
- Journal `_prisma_migrations` : migration nommée, terminée et non annulée; checksum SHA-256 comparé au SQL source (tolérance aux fins de ligne CRLF).
- Contrôles SQL sur `pg_catalog.pg_class`, `information_schema.columns` et `pg_catalog.pg_constraint` (`convalidated`), sans mutation.
- `src/server/teams/write.ts` : avant écriture sur une base v32, vérification de la capacité `per-team-agile-mode`; les erreurs produisent `schema-not-ready`.
- `tests/schema-integrity.test.ts` : cas version non valide, migration absente, checksum invalide, manque d'objet et sonde SQL exclusivement SELECT.

## Résultats attendus
- Une colonne `smn_team.agile_mode` ou `smn_team.is_archived` manquante refuse l'écriture.
- La contrainte `smn_team_agile_mode_check` absente/non validée refuse l'écriture.
- Une migration v32 non terminée, annulée, ou avec checksum différent refuse l'écriture.
- La sonde ne répare pas et ne crée pas de table : un script de migration explicite reste obligatoire.

## Conception et limites
- Le diagnostic global et l'authentification disposent déjà de leurs propres garde-fous; la consolidation complète de ces vérifications dans le registre est à poursuivre avec SMN-331.
- Les sondes interrogent les métadonnées à chaque appel. Éviter de les appeler sur chaque requête de lecture; privilégier démarrage, diagnostic et écritures sensibles jusqu'à mesure de performance.
- Aucune assertion n'est faite sur un test PostgreSQL réel dans cette intervention. Une vérification SQL réelle reste indispensable.

## Validation à réaliser
```powershell
pnpm exec tsx --test tests/schema-integrity.test.ts tests/schema-compatibility.test.ts tests/team-agile-mode-v32.test.ts
pnpm typecheck
pnpm test
pnpm lint
pnpm db:diagnose
```
Recette PostgreSQL : copie de v31 → migration v32 → sonde succès; puis simulation contrôlée sur base jetable de suppression de colonne/contrainte ou altération de checksum → refus explicite; ne pas altérer la base de travail de l'utilisateur.

## Dépendances
SMN-328 (registre), SMN-331 (déploiement transversal), SMN-333 (tests réels v31→v32).
