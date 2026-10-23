# SMN-103 — Surveillance des échéances

Jira : https://lmn24.atlassian.net/browse/SMN-103

Livré sur `main` : seuil administrable de 3 jours calendaires par défaut, sauvegardé dans `smn_registry_deadline_settings` avec version et contrôle de conflit ; calcul pur des échéances proches et retards pour les actions À faire/En cours et les dépendances Ouvertes/En cours ; exclusions explicites pour les fiches sans date, Terminées/Annulées/Satisfaites. Aucun changement de statut, date, rapport ou PDF. API GET/PATCH sécurisée et consultation des signaux sur l'écran des registres, avec type de vigilance, fiche et échéance ; libellés FR/EN.

Limites : le signal est actuellement intégré à la liste des registres, pas à tous les widgets du cockpit. L'API calcule la date UTC du serveur ; la référence calendaire Europe/Paris reste à vérifier et aligner. Aucun test `typecheck`, `tsx`, i18n, build ou recette PostgreSQL/navigateur n'a été exécuté. Jira demeure ouverte.

Contrôles Windows : `git pull` ; `pnpm typecheck` ; `pnpm exec tsx --test tests/smn-103-registry-deadlines.test.ts` ; `pnpm i18n:check` ; `pnpm build`.
