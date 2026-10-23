# SMN-119 — Fidélité historique et qualité des données

Jira : https://lmn24.atlassian.net/browse/SMN-119 — Story 6.8.

## Publié sur main

- Service `src/server/reports/data-quality.ts`, rattaché à `composeStandardReport`, indiquant le statut provisoire, historique ou historique manquant ; version Vn et horodatage de clôture conservés.
- Capacité initiale/réelle : qualité renseignée comme enregistrée ou indisponible, et provenance connue conservée lorsque le cliché la fournit ; aucun état calculé/estimé inventé.
- Prévisualisation présentant la provenance et la version de l'instantané avec traductions FR/EN.
- Les autres sections clôturées composées dans SMN-114 utilisent le snapshot Vn et non les tables des registres courants.
- Tests de contrat dédiés : `tests/smn-119-report-quality.test.ts`.

## Réserves

- Les différences détaillées estimé/calculé/manuel ne sont affichées que lorsque la provenance source est effectivement stockée dans le cliché, dont la structure mérite une vérification PostgreSQL.
- Les dates d'effet métier et associations manquantes de SMN-111 limitent encore la fidélité de tous les registres.
- Le moteur PDF n'existe pas encore à ce stade : immutabilité des PDF V1 et composition après reclôture V2 à tester ultérieurement.
- Aucun typecheck, test, build, recette PostgreSQL/navigateur exécuté. Story non clôturée dans Jira.

Validation Windows : `git pull` ; `pnpm typecheck` ; `pnpm exec tsx --test tests/smn-119-report-quality.test.ts` ; `pnpm i18n:check` ; `pnpm build`.
