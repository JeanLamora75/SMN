# SMN-124 — Prévisualisation HTML complète du rapport

Jira : https://lmn24.atlassian.net/browse/SMN-124 — Story 6.13.

## Livré sur main
- Action « Prévisualiser le rapport » dans la préparation et page HTML de lecture seule `/app/admin/sprints/[sprintId]/report/preview`, authentifiée et réservée à l'administrateur.
- Recomposition à chaque visite à partir des options enregistrées : sections visibles et leur ordre, métriques sélectionnées, introduction, conclusion, commentaires inclus, contexte d'équipe choisi et aperçu historique.
- En-tête permanent avec équipe, produit, statut, dates, version Vn et date de situation, signalement explicite des cycles provisoires.
- Valeurs non renseignées affichées comme telles, sans invention de zéro ; aucune écriture ou archivage PDF dans ce lecteur.
- FR/EN, test de refus sur Sprint inexistant préparé.

## Limitations et dépendances
- Les faits qualitatifs issus des tables Epic 5 ne sont volontairement pas inclus faute de garantie complète de filtrage masqué/invalide et d'associations sûres ; les sections concernées sont signalées indisponibles, ce qui laisse AC1 incomplet.
- Le rendu historique est actuellement tabulaire ; les graphiques visuels définitifs ne sont pas implémentés.
- L'aperçu recharge les options sauvegardées et non les modifications non enregistrées ; l'utilisateur doit enregistrer ses choix avant prévisualisation.
- La composition réutilise les lecteurs SMN-114 à SMN-121, non encore recettés. Aucun typecheck, test, build ou recette navigateur/PostgreSQL exécuté ; Jira reste ouverte.

Commandes Windows : `git pull` ; `pnpm typecheck` ; `pnpm exec tsx --test tests/smn-124-html-preview.test.ts` ; `pnpm i18n:check` ; `pnpm build`.
