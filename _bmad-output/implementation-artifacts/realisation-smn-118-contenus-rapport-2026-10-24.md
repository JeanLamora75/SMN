# SMN-118 — Choix des KPI et informations qualitatives

Jira : https://lmn24.atlassian.net/browse/SMN-118 — Story 6.6.

## Livraison sur main

- Contrat de sélection strict pour les KPI Scrum (SP engagés/réalisés, JH planifiés/réels, pourcentage calculable uniquement si engagement SP > 0) et les catégories de fiches des six registres.
- Préservation des unités SP, JH et %. Toute mesure absente demeure indisponible (valeur null, pas de zéro fictif).
- Pré-filtrage explicite des faits masqués, invalidés, non sélectionnés et des catégories désactivées.
- Choix optionnel d'une analyse humaine existante, sans génération IA ; faute d'adaptateur vérifié, l'aperçu indique indisponible.
- Sauvegarde d'options par Sprint dans une table spécifique, contrôlée par les droits Admin, révision optimiste et audit.
- UI Bootstrap FR/EN dans la préparation du rapport, aperçu des valeurs fiables depuis la projection SMN-116.

## Limites à traiter avant conformité complète

- L'aperçu ne dispose pas encore de l'adaptateur sûr associant les faits Epic 5 au Sprint : liste des faits actuellement vide volontairement, pour éviter de remonter des données sans filtrage fiable.
- Les graphiques et les analyses humaines sauvegardées ne sont pas encore raccordés aux producteurs métiers ; ils ne sont pas fabriqués.
- Les options n'alimentent pas encore le rendu PDF, qui est à développer dans les prochaines Stories ; AC5 à tester lors du raccordement.
- Le pourcentage correspond au ratio SP terminés/engagés, présenté seulement si les deux sources existent, et peut dépasser 100 %.
- Aucun test, typecheck, build ni recette PostgreSQL/navigateur n'a été exécuté ; Jira reste ouverte.

Commandes Windows : `git pull` ; `pnpm typecheck` ; `pnpm exec tsx --test tests/smn-118-report-content.test.ts` ; `pnpm i18n:check` ; `pnpm build`.
