# SMN-108 — Faits marquants automatiques confirmés

Jira : https://lmn24.atlassian.net/browse/SMN-108

Sur `main` : stockage des événements automatiques liés à la catégorie, source et révision avec unicité, et émission dans la même transaction que les écritures métier. Sources raccordées : passage d'une évaluation de risque à criticité élevée, retour du ROAM depuis Resolved, signal À risque d'une dépendance, résolution d'un obstacle, création d'une décision Active, dépendance satisfaite si catégorie activée, atteinte explicite d'un objectif. Configuration issue de SMN-107 consultée au moment de la transition, sans rattrapage rétroactif. Lecture collective dédiée et liste sur la page Registres. Les prévisualisations et cérémonies ne sont pas branchées à l'émetteur.

Points de vigilance : la production d'un risque élevé suppose une transition détectable sur l'évaluation ou le ROAM ; les différentes combinaisons et l'absence de table facultative nécessitent une recette PostgreSQL. La navigation d'un fait Objectif présente son identifiant, sans lien vers une fiche objectif dédiée. Le journal automatique n'est pas encore fusionné chronologiquement avec les faits manuels. Aucun typecheck, test, build ou recette navigateur/PostgreSQL exécuté ; GitHub Actions indisponibles et Jira non clôturée.

Commandes Windows : `git pull` ; `pnpm typecheck` ; `pnpm exec tsx --test tests/smn-108-confirmed-highlights.test.ts` ; `pnpm i18n:check` ; `pnpm build`.
