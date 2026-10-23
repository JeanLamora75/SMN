# SMN-123 — Création, duplication et modification des modèles de rapport

Jira : https://lmn24.atlassian.net/browse/SMN-123 — Story 6.11.

## Développement publié sur main

- Duplication du Standard ou d'un modèle personnalisé sous une nouvelle identité UUID.
- Renommage, sélection des six sections, ordre et visibilité, KPI et catégories qualitatives, option d'analyse humaine et profondeur historique 1–5.
- Modification atomique avec contrôle de révision optimiste ; une erreur déclenche rollback et aucun succès n'est affiché.
- Protection du modèle standard pour toutes les actions d'écriture. API POST sous autorisation administrateur.
- Interface Bootstrap FR/EN avec protection contre l'abandon de modifications non enregistrées.
- Lecture tolérante des anciennes tables avant l'ajout des colonnes de version et profondeur.

## Réserves

- Suppression physique des modèles personnalisés temporairement refusée pour éviter de casser des archives ou des rapports qui pourront les référencer : AC4 partiel, politique de suppression/désactivation et aperçu des impacts à prévoir.
- La configuration du modèle est mémorisée, mais son application effective en sélectionnant le modèle pour un rapport n'est pas encore intégrée : dépendance des prochains incréments.
- Pas d'outil de configuration de graphique distinct : les catégories de métriques sont enregistrées.
- Aucun test ni typecheck, build ou recette DB/navigateur n'a été exécuté ici. Statut Jira conservé ouvert.

Contrôle Windows : `git pull`, `pnpm typecheck`, `pnpm exec tsx --test tests/smn-123-report-templates.test.ts`, `pnpm i18n:check`, `pnpm build`.
