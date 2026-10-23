# SMN-110 — Sélection des faits pour les reportings

Jira : https://lmn24.atlassian.net/browse/SMN-110

Publié sur `main` : sélection commune des faits manuels (`highlight`) et automatiques, lecture collective filtrée à l'installation, exclusion logique des faits masqués/invalidés des sélections par défaut. API admin sécurisée pour masquer, promouvoir, choisir/déchoisir, avec verrou, revision optimiste et audit dédié ; aucun UPDATE des registres ou des objectifs. Table et panneau Bootstrap FR/EN sur la page Registres. Les changements s'appliquent à l'état de préparation du prochain rapport, sans régénérer les historiques ou les PDF.

Limites : l'écran contient la sélection préliminaire et son compteur, mais **pas de rendu PDF ni de validation globale de rapport** ; le raccordement à l'Epic 6 reste à faire (AC4 partiel). Les faits masqués et invalidés restent consultables dans le tableau pour raison d'audit, mais ne sont plus éligibles à la présélection. Aucun test/typecheck/build ni essai PostgreSQL/navigateur exécuté ; Jira reste ouverte.

Validation locale : `git pull` ; `pnpm typecheck` ; `pnpm exec tsx --test tests/smn-110-fact-selection.test.ts` ; `pnpm i18n:check` ; `pnpm build`.
