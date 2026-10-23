# SMN-101 — Obstacle assisté depuis un risque

Jira : https://lmn24.atlassian.net/browse/SMN-101

## Réalisation publiée sur main

- Fiche risque : bouton « Créer un obstacle » pour administrateur, brouillon prérempli par titre et description du risque, modifiable, annulable sans appel d'écriture.
- API POST `/api/admin/registries/[id]/materialize` avec validation d'équipe et de rôle, création d'une fiche obstacle d'identifiant distinct et ajout d'une relation risque→obstacle consultable bidirectionnellement grâce au module SMN-100.
- Transaction PostgreSQL unique : obstacle, audit de sa création, lien et audit du lien ; rollback si l'une des étapes échoue.
- Aucune modification du statut du risque, de ROAM, de probabilité ou d'impact. La résolution de l'obstacle ne met pas automatiquement à jour son risque source.
- Traductions FR/EN et tests ciblés `tests/smn-101-risk-materialization.test.ts`.

## Réserves

- Le brouillon n'impose pas de preuve d'une matérialisation effective du risque : l'administrateur reste responsable de la décision métier.
- Le lien est visible sur les deux fiches via le composant de relations commun déjà livré, mais la recette navigateur n'a pas été effectuée.
- Le code et les tests ont été publiés, mais aucune exécution locale de TypeScript, tests, build, Postgres ou navigateur n'a été réalisée, et GitHub Actions n'est pas disponible. Jira reste ouvert.

Validation locale : `git pull` ; `pnpm typecheck` ; `pnpm exec tsx --test tests/smn-101-risk-materialization.test.ts` ; `pnpm i18n:check` ; `pnpm build`.
