# SMN-49 — Story 3.8 : Calendriers nationaux embarqués

**Jira** : [SMN-49](https://lmn24.atlassian.net/browse/SMN-49) · **Parent** : SMN-3 · **Dépendance** : SMN-48.

## Given / When / Then et implémentation

- **AC1.** Un pays de référence FR, DE ou GB déclenche une recherche des seuls fichiers JSON embarqués dans le code serveur. `ensureReferenceNationalCalendar` (post-migration et accès authentifié) n'appelle aucun service externe.
- **AC2.** La fenêtre N−2/N−1/N/N+1 est calculée à partir de `smn_installation.created_at` ; chaque entrée est datée et nommée. Les jeux locaux couvrent 2024–2035, avec conventions nationales explicites.
- **AC3.** `preloadNationalCalendar` protège les écritures par transaction PostgreSQL, verrou et contraintes PK (pays/date et pays/année). `ON CONFLICT` préserve l'idempotence.
- **AC4.** L'absence de fichier ou d'année n'empêche ni installation ni accès : le résultat `not-configured` comporte un diagnostic, et la liste de dates n'est jamais assimilée à zéro.
- **AC5.** `validateNationalYear` refuse toute date invalide, incohérence de pays, doublon ou nom vide pour une année complète. État `invalid` visible par l'Administrateur et conservé dans `smn_national_calendar_coverage`.

## Fichiers touchés

- Migration v16 : `src/server/holidays/migration.ts`, son miroir `prisma/migrations/20261021_smn49_national_calendars/migration.sql`, schéma Prisma, diagnostics, sonde et gestionnaire de migrations.
- `src/server/holidays/preload.ts` et trois jeux JSON ; `src/server/auth/database.ts` (initialisation non bloquante).
- `src/server/countries/catalog.ts`, interface `src/app/app/admin/countries/country-admin.tsx`, API privée `src/app/api/admin/countries/calendar/route.ts`.
- `src/server/members/location.ts` raccorde l'indicateur de disponibilité au pays/année.
- Contrats : `tests/national-holidays.test.ts`. Documents : `docs/CALENDRIERS-NATIONAUX-SMN-49.md`.

## Vérifications et risques résiduels

La validité statique des jeux doit être confirmée en recette contre les sources nationales de référence : fêtes régionales exclues et différences locales britanniques. Couverture bornée 2024–2035 ; au-delà, l'état reste volontairement non configuré. Les tests locaux (`pnpm i18n:check`, `lint`, `typecheck`, `test`, `build`) et la recette SQL/HTTP n'ont pas encore été exécutés. BMAD : `review`, Jira : `En cours`.
