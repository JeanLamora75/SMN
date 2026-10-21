# SMN-48 — Story 3.7 : Catalogue des sept pays initiaux

Références : [Jira SMN-48](https://lmn24.atlassian.net/browse/SMN-48), FR-9/10, D-PRD-015/018, AD-12/31, Epic 3. Contrat fonctionnel validé le 19 octobre 2026.

## Critères d'acceptation

- **AC1.** Au premier démarrage après migration, la table `smn_country` comporte exactement les sept références **FR France, DE Allemagne, GB Royaume-Uni, ES Espagne, PT Portugal, IT Italie et CA Canada**. La clé `code` est unique.
- **AC2.** Un Administrateur crée un pays supplémentaire à partir d'un **code ISO à deux lettres attribué** et d'un nom non vide (120 caractères maximum) ; ni fichier ni calendrier de jours fériés ne sont exigés. Il devient visible dans le catalogue et proposé comme option depuis la localisation d'un membre.
- **AC3.** Deux tentatives avec le même code ne créent pas de doublon : `PRIMARY KEY (code)`, `INSERT ... ON CONFLICT (code) DO NOTHING` et retour applicatif `409 duplicate-code`. Une nouvelle entrée n'écrase jamais une entrée existante.
- **AC4.** La lecture et les mutations de `/api/admin/countries` sont protégées par la session et les autorisations serveur de type `settings`. Le rôle Utilisateur ne peut pas écrire (403), y compris par appel direct.
- **AC5.** Les calendriers nationaux **non chargés** ne sont pas des listes vides de jours fériés : l'API retourne `nationalCalendar: { status: "not-configured", holidays: null }`. Aucun calendrier national n'est créé par cette Story. Des Stories ultérieures devront raccorder un statut « configuré » aux vrais jeux de données importés ; aucun état « 0 jour férié » n'est inféré.

## Architecture et périmètre

- Migration additive **v14→v15** `src/server/countries/migration.ts`, miroir SQL `prisma/migrations/20261021_smn48_country_catalog/migration.sql`. Seed SQL transactionnel des sept pays, sans modification des comptes, de la langue ni des localisations historiques.
- `src/server/countries/catalog.ts` : lecture triée, validation de code depuis le validateur central existant, écriture atomique à unicité SQL.
- `src/app/api/admin/countries/route.ts` : GET et POST privés, contrôle d'origine.
- `src/app/app/admin/countries/page.tsx` + `country-admin.tsx` : gestion des pays, état explicite des calendriers ; navigation Administration → Pays.
- `src/app/app/admin/members/member-location-editor.tsx` : propositions dynamiques du catalogue via datalist, sans lier pays à langue ni supposer un fuseau.
- `prisma/schema.prisma` : modèle `SmnCountry`. Diagnostics et sonde doivent reconnaître la table supplémentaire et les cinq colonnes.
- Les calendriers nationaux réels, l'import CSV/ICS et les exceptions régionales sont **hors périmètre**.

## Qualification et blocage éventuel

Tests de contrat rédigés dans `tests/country-catalog.test.ts` ; recette HTTP/SQL et RBAC à qualifier sur environnement pilote Windows/PostgreSQL 18.6. Respecter `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.

**Ne pas fusionner sur `main`** tant que `src/server/installation/contract.ts` et `src/server/db/probe.ts` n'acceptent pas correctement le nouveau catalogue : sinon l'installation v15 serait diagnostiquée « incompatible » ou « incomplète ». Le connecteur GitHub a refusé ces deux modifications dans la présente session. La revue de code et la CI n'ont pas été exécutées avec succès.

L'agent Amelia a lu le skill BMAD, mais le lanceur natif `bmad-build` (`uv run --no-cache`) n'a pas été exécuté faute de checkout local et de l'environnement `uv` ; travail manuel avec connecteurs. Ne pas prétendre au statut « Terminé » dans Jira avant recette.
