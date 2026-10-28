# Consolidation Pays — lot 1 : Prisma, schéma et installation

**Date :** 28 octobre 2026. **Branche :** `consolidation/smn-pays-lot1-schema-2026-10-28`, créée depuis `main`. **Statut :** analyse de compatibilité, aucune migration exécutée.

## Écarts constatés directement dans les fichiers

Sources : `prisma/schema.prisma` et `src/server/installation/contract.ts` sur `main` et sur `feat/smn-281-country-regression-recipe` (#201).

### Fonctionnalités Pays manquantes dans main

- `SmnCountryLifecycleAudit` : historique d'archivage/réactivation des pays et révisions.
- `SmnCountryNameAudit` : historique des renommages.
- `SmnNationalHolidayManualAudit` : traçabilité des éditions manuelles des jours fériés.
- `SmnNationalCalendarValidationAudit` : validation annuelle et empreinte.
- Champs de validation annuelle : `administrativeValidatedAt`, `validatedRevision`, `validatedBy`, `validationSource`.
- Le contrat d'installation Pays ajoute quatre objets SQL correspondants.

### Développements main à préserver impérativement

- `SmnAccountTeamPreference` et les relations équipe/compte de la couche multiéquipes.
- `SmnLinkCategory`, `SmnLink`, `SmnLinkAudit` et leurs relations pour le module Liens.
- Les changements de nullabilité et d'unicité des relations `productId`, `installationId` et `team` déjà présents dans `main`.
- Les trois objets SQL `smn_link_category`, `smn_link`, `smn_link_audit` du contrat d'installation.

## Décisions et contrôles obligatoires

1. **Ne jamais remplacer intégralement** le schéma ou le contrat de `main` par ceux de la branche #201. Cela supprimerait les types et relations récents du module Liens et des préférences d'équipe.
2. Préparer une migration SQL **additive, idempotente et versionnée** pour les tables d'audit Pays et les colonnes de validation annuelle ; vérifier les contraintes de références existantes et les tables réellement présentes.
3. Ajouter seulement ensuite les quatre modèles Prisma et les champs correspondants, avec relations bidirectionnelles cohérentes.
4. Actualiser le contrat d'installation pour intégrer simultanément les quatre nouvelles tables Pays **et** préserver les trois tables Liens déjà reconnues.
5. Vérifier la cohérence avec `src/server/installation/contract.ts`, la version des migrations et la détection de schéma avant de rendre les routes Pays accessibles.
6. Exécuter `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` et le diagnostic PostgreSQL sur Windows 11 avant intégration.

**Risque majeur identifié :** écraser le modèle `SmnAccountTeamPreference` ou les modèles `SmnLink*` en important le `schema.prisma` historique.

**Pas de code de migration publié dans ce lot ; aucune PR fusionnée ou fermée.**

## Implémentation partielle du 28 octobre

- `prisma/schema.prisma` enrichi avec les quatre modèles Pays et leurs relations, en conservant les modèles Liens et préférences multiéquipes de `main`.
- `src/server/installation/contract.ts` enrichi avec les quatre tables Pays tout en conservant les tables Liens.
- **Attention : le schéma SQL réel n'a pas été migré.** Les fonctions historiques `ensureCountryNameSchema` et `ensureCountryArchiveSchema` effectuent des changements DDL à l'exécution ; leur remplacement par des migrations versionnées doit précéder toute activation du code Pays.
- **Non validé :** `prisma validate`, typecheck, tests, migrations, build, recette. Ne pas fusionner ce lot dans `main` à ce stade.

## Migration SQL versionnée publiée

Fichier : `prisma/migrations/20261028_smn270_281_country_consolidation/migration.sql`.

La migration est additive (quatre tables d'audit Pays, champs de révision / archivage / attestation, index et références). Elle conserve les tables Liens et les préférences d'équipe. Le marqueur `schema_version` ne passe de 29 à 30 que lorsque la base indique 29.

**Contrôles bloquants restants :** valider le mécanisme de migration Prisma sur une base de développement, la cohérence du marqueur de version avec le code de démarrage, les différences éventuelles de structures préexistantes, les modèles Prisma et la non-régression. Aucune commande ni migration PostgreSQL n'a été exécutée. Ne pas fusionner ce lot sur `main` avant ces vérifications.

## Compatibilité diagnostic v30 — contrôle statique

Le diagnostic existant refusait les versions supérieures à 29 et le probe ne lisait que 29 migrations. Correctifs publiés : `diagnostic.ts` accepte 30, recherche la migration Pays v30 et contrôle les quatre tables d'audit ; `probe.ts` lit jusqu'à 30 migrations, valide les colonnes Pays en v30 et maintient le contrôle du schéma Liens pour toute version >=29.

**Limites à lever avant fusion :** le contrôle v30 vérifie le statut de migration et l'existence des objets/colonnes mais pas encore l'empreinte SHA-256 de la migration ni toutes les contraintes SQL. Il faut ajouter les tests de diagnostic v29/v30, vérifier la compatibilité avec le moteur qui applique les migrations Prisma, contrôler le marqueur v30 sur base de développement et exécuter réellement TypeScript/tests/build. Aucune migration SQL ni commande locale exécutée ici.

## Vérification SHA-256 et tests (suite)

Le code `src/server/countries/consolidation-migration.ts` fige le texte SQL v30 du dossier Prisma ; `src/server/installation/diagnostic.ts` exige désormais une empreinte SHA-256 identique dans `_prisma_migrations`, en plus de la date de réussite, de l'absence de rollback et de la structure observée. Test statique créé dans `tests/country-consolidation-v30.test.ts` (égalité SQL, présence Pays et Liens, nombre de migrations v30, assertions de migration additive).

**Limites restantes :** les tests ajoutés ne démontrent pas une installation v29 valide ni une installation v30 valide de bout en bout ; fixtures réalistes de 29/30 migrations et contrôles SQL de contraintes toujours à écrire. Aucune commande de tests, Prisma ou PostgreSQL exécutée. Le lot n'est pas prêt à être fusionné sur `main`.
