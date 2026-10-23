# SMN-96 — États et vigilance des dépendances

Jira : https://lmn24.atlassian.net/browse/SMN-96

Livré sur main : signal À risque indépendant et historisé, API de lecture et modification avec permissions, composant de fiche, tests ciblés, traduction FR/EN. Les statuts Ouverte, En cours, Satisfaite et Annulée restent gérés par le registre central avec historique.

La règle de retard n'inclut que les dépendances ouvertes ou en cours avec échéance passée. Elle n'est pas encore raccordée au cockpit. L'association aux cycles et aux snapshots de clôture reste en attente des autres Stories Epic 5.

Aucune exécution de tests, de typecheck, de build ou de recette PostgreSQL/navigation n'est confirmée. Jira non clôturé. Sur Windows : git pull ; pnpm typecheck ; pnpm exec tsx --test tests/smn-96-dependency-vigilance.test.ts ; pnpm i18n:check ; pnpm build.
