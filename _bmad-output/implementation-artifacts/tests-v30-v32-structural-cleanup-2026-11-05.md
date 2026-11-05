# SMN — Nettoyage des tests v30–v32 : gardes structurels et DDL

Date : 5 novembre 2026. Modifications uniquement des tests, de leur inventaire et de la documentation sur la branche `main`.

## État initial vérifié

La CI du commit `c0173919c925` était **rouge** uniquement sur les deux jobs de tests Windows et Linux/PostgreSQL : la nouvelle suite `schema-v33-no-runtime-ddl.test.ts` rejetait le texte d'un message d'erreur dans `src/server/reports/templates.ts` mentionnant `apply-deferred-schema-v32`. Ce message ne déclenchait aucune migration SQL. Les jobs TypeScript, gardes de schéma et contrats entreprise étaient réussis.

## Nettoyage du présent lot

1. `tests/schema-v33-no-runtime-ddl.test.ts` : correction du faux positif. Les services métier doivent toujours être dépourvus de DDL. Seuls les **appels exécutables ou imports** vers l'ancien mécanisme de migration sont interdits, pas les textes explicatifs des erreurs.
2. `tests/schema-v32-no-runtime-ddl-regression.test.ts` : supprimé, les relations et leur absence de DDL actif étant contrôlées par la suite v33.
3. `tests/schema-v33-structural-guards.test.ts` : nouveau contrat v33 vérifiant les colonnes d'équipe, les contraintes des modes Agile, les rattachements tenant/entreprise, les clés étrangères validées et l'application des diagnostics de schéma.
4. `tests/schema-v32-structural-guards.test.ts` : supprimé, car les assertions sur les anciennes instructions `schema_version=31/32` et les scripts de migrations sont couvertes par les garanties actuelles ou ne concernent plus la baseline native.
5. `tests/coverage/historical-contracts.json` : suppression du verrou historique sur l'ancien test DDL après transposition v33.

## Garanties préservées

Aucune modification du code applicatif, du modèle SQL, des fichiers de migrations ou des données locales. Les tests de restauration, rollback, conservation des snapshots de sprints clos et isolation des équipes restent en place. Les contrôles de schéma v33 ne remplacent pas les tests d'intégration PostgreSQL.

## Validation attendue

La CI I0 doit réussir sur Windows et Linux/PostgreSQL, en particulier les nouvelles suites `schema-v33-no-runtime-ddl` et `schema-v33-structural-guards`. Les workflows spécialisés SMN-348 à SMN-351 doivent rester verts.

[GitHub Actions sur main](https://github.com/JeanLamora75/SMN/actions?query=branch%3Amain)
