# SMN-107 — Paramétrer les six catégories automatiques

Jira : https://lmn24.atlassian.net/browse/SMN-107

Livré sur `main` : catalogue fixe de six catégories, cinq activées par défaut ; Dépendance satisfaite désactivée. Validation serveur du catalogue, données de configuration versionnées par installation et mise à jour transactionnelle, autorisation lecture collective et écriture administrateur. Interface Bootstrap avec six interrupteurs et i18n FR/EN depuis la page des registres. Aucun déclenchement rétroactif ni création de nouveaux événements dans cette Story ; les futurs producteurs de faits automatiques devront respecter cette configuration lors d'événements métier confirmés.

Tests de contrat ajoutés dans `tests/smn-107-automatic-highlights.test.ts`. Non exécutés : `pnpm typecheck`, `pnpm exec tsx --test tests/smn-107-automatic-highlights.test.ts`, `pnpm i18n:check`, `pnpm build`, recette PostgreSQL et navigateur. GitHub Actions indisponibles. Jira non clôturée.
