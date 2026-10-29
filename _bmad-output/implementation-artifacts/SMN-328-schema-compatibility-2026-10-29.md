# SMN-328 — Registre central des capacités de schéma

Date : 29 octobre 2026. État : **premier incrément développé**, non terminé.

## Livré sur main
- `src/server/schema/compatibility.ts` : `CURRENT_SCHEMA_VERSION=32`, versions minimales de cinq capacités, refus des versions invalides/inconnues/futures et erreurs explicites.
- `tests/schema-compatibility.test.ts` : tests unitaires des seuils et du refus fail-closed.
- `src/server/teams/resolve.ts` : première intégration de `evaluateSchemaCapability(...,"multi-team")` remplaçant la liste répétée v28–v32 dans le contrôle d'entrée et la condition SQL. L'accès à l'équipe reste contrôlé par l'identité administrateur et son installation.

## Portée de cette première version
Ce registre est une vérification **de version uniquement**, pas encore une preuve d'intégrité physique : le contrôle du journal des migrations et des objets PostgreSQL reste dans `diagnostic.ts`, `probe.ts`, auth et les services existants. Ne pas présenter le contrat comme une autorisation définitive de capacité tant que SMN-329 n'est pas intégré.

## Suites
1. Remplacer les autres gardes en conservant les chemins legacy explicites.
2. Ajouter le contrôle de structure et des migrations `requireSchemaCapability(db,...)` (SMN-329).
3. Étendre les tests aux contextes v31/v32 et empêcher une nouvelle liste de versions dans les API.
4. Exécuter `pnpm exec tsx --test tests/schema-compatibility.test.ts`, `pnpm typecheck`, `pnpm test` et la CI.

Aucune validation TypeScript/CI ou PostgreSQL réelle n'est attestée dans cet incrément.
