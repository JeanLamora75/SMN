# SMN-102 — Actions assistées depuis une décision

Jira : https://lmn24.atlassian.net/browse/SMN-102

Implémenté sur `main` : brouillon prérempli depuis une décision, édition du titre, du contexte, du responsable et de l'échéance optionnelle ; annulation sans persistance ; création atomique d'une action autonome avec ID distinct, audit initial et lien à la décision avec audit dans `smn_action_link`. La création peut être répétée, sans altérer le statut de la décision, ni modifier d'autres actions. API POST admin uniquement et traductions FR/EN.

Les relations sont actuellement lisibles depuis la fiche Action via SMN-99 ; **la liste inverse persistée des actions depuis la fiche Décision n'est pas encore raccordée**, seuls les identifiants produits pendant la session y apparaissent. AC2 partiellement intégré sur la navigation réciproque. Aucun test local, typecheck, build ou intégration navigateur/PostgreSQL n'a été exécuté ; Jira reste ouverte.

Vérification Windows : `git pull`, `pnpm typecheck`, `pnpm exec tsx --test tests/smn-102-decision-actions.test.ts`, `pnpm i18n:check`, `pnpm build`.
