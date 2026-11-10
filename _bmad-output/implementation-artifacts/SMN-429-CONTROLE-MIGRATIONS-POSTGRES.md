# SMN-429 — Contrôle versions et migrations PostgreSQL pendant les mises à jour

**Epic** SMN-424 · **Agent** Amelia · **10/11/2026** · **Code publié sur `main`; recette Windows à confirmer**

## Périmètre implémenté

Le format de mise à jour hors ligne actuellement signé par SMN-426/427 **ne contient aucune migration SQL exécutable**. Son contrat `requires` est actuellement limité à Node 24, PostgreSQL 18 et schéma v33. Ce jalon renforce la voie **application uniquement** ; il n'autorise pas la migration automatique de v32 vers v33, ni de v33 vers v34.

- `scripts/windows/schema-update-policy.mjs` : décision explicite `noop` pour les versions supportées et historiques cohérents, refus pour toutes les incompatibilités et ambiguïtés.
- `src/server/updates/schema-preflight.ts` : lecture réelle du catalogue PostgreSQL en transaction `REPEATABLE READ READ ONLY` via `probePostgres` puis `classifySnapshot`, contrôle du schéma indicateurs v33 et des migrations terminées, uniques et non annulées.
- `src/app/api/admin/updates/confirm/route.ts` : recontrôle avant mise en attente de la mise à jour et avant arrêt du serveur ; sauvegarde vérifiée (SMN-428) toujours préalable ; enregistrement d'un justificatif court et borné.
- `scripts/windows/update-apply.mjs` : refuse un justificatif manquant, périmé, ou de version incompatible avant le premier déplacement de fichiers. Il ne lance aucun SQL.
- `scripts/windows/package-portable.mjs` et `scripts/windows/verify-package.mjs` : contrôle de présence des composants du contrat dans le paquet.
- `src/app/app/admin/settings/maintenance/updates-admin.tsx`, `src/i18n/fr.json`, `src/i18n/en.json` : refus explicite et localisé.
- `tests/schema-update-policy.test.mjs` et `tests/update-import.test.mjs` : contrats de rejet et fixture du justificatif ; intégration dans `.github/workflows/update-package.yml`.

## Matrice de compatibilité

| Base source | Paquet cible (contrat actuel) | Décision |
|---|---|---|
| PostgreSQL 18, schéma v33, diagnostic complet et historique sain | Schéma v33 | **Aucune migration nécessaire**, installation applicative autorisée après sauvegarde |
| PostgreSQL 17 ou 19 | Schéma v33 | Refus |
| PostgreSQL 18, schéma v32, v34 ou historique non fiable | Schéma v33 | Refus, aucune tentative DDL |
| Historique ambigu : checksum invalide, doublon, migration inachevée ou annulée | Schéma v33 | Refus |
| Contrat de paquet futur demandant un schéma différent | Autre schéma | Refus tant qu'une procédure de maintenance indépendante n'est pas qualifiée |

**Règle déterminante :** le ZIP applicatif n'applique pas de migration DDL. Une future évolution de schéma exige un catalogue SQL versionné et signé, un plan ordonné, une sauvegarde éprouvée, une action explicite, des contrôles avant/après, une compatibilité du retour arrière et une recette PostgreSQL 18 isolée. Rien de cela n'est simulé ou présumé ici.

## Preuves requises avant clôture

1. Succès vérifiable de `update-contract-tests` sous Windows (tests de sécurité du ZIP et politique PostgreSQL).
2. Succès `portable-windows` avec inclusion de tous les modules et runtime autonome.
3. Recette d'une installation jetable réelle avec données indicateurs v33, équipes, historiques et documents Office/PDF avant/après mise à jour, contrôle des empreintes et comparaison de données.
4. Cas adverses : version PostgreSQL 17/19, schéma 32/34, migration inachevée, checksum divergent, erreur d'accès, sauvegarde indisponible et coupure pendant la préparation.
5. Audit transversal AC3 : vérifier séparément l'absence de DDL implicite sur **toutes** les routes de consultation déjà existantes. Le présent travail n'atteste pas cet audit.
6. Le justificatif de contrôle réalisé avant l'arrêt du serveur peut devenir obsolète en cas d'intervention parallèle dans PostgreSQL ; une attestation transactionnelle à l'instant de bascule est un renforcement à qualifier pour les scénarios de migrations futures.

**Statut recommandé Jira :** en cours / en validation. Ne pas clôturer sans les résultats CI et Windows. Aucun script `uv` exécuté.
