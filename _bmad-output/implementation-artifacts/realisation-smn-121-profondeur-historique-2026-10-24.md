# SMN-121 — Profondeur historique et tendances bornées à cinq Sprints

Jira : https://lmn24.atlassian.net/browse/SMN-121 — Story 6.7.

## Implémentation publiée

- Lecteur `readReportTrends` limité à 1–5 Sprints réellement clôturés de l'équipe, dont la fin ne dépasse pas le début du Sprint de référence, par snapshot historique Vn.
- Exclusion des Sprints encore ouverts ou rouverts ; absence de métrique conservée à `null`, conformément à `projectSprintTrend`.
- Profondeur sauvegardée indépendamment du modèle standard via `smn_report_history_options`, sans mutation des Sprints ou des KPI. Validation des entrées et révision optimiste.
- API GET/PATCH administrateur et panneau de préparation FR/EN avec aperçu tabulaire et unité SP, %, JH.
- Tests de contrat préparés dans `tests/smn-121-report-history.test.ts`.

## Limites et suivi

- Les tendances figurent dans un panneau de prévisualisation dédié, et ne sont pas encore intégrées aux exports PDF ni aux graphiques définitifs.
- Par choix conservateur, la tendance analyse les cycles entièrement antérieurs au début du Sprint cible ; le Sprint cible, même clôturé, n'est pas compté comme cycle historique. À confirmer en recette UX.
- La profondeur des autres éléments historiques n'est pas bornée par ce lecteur, mais leur rendu dépend de futures Stories.
- Les paramètres sont conservés par Sprint/brouillon, pas encore par rapport exporté et archivé.
- Aucun test, typecheck, build ni essai PostgreSQL/navigateur exécuté. Jira reste ouverte.

Validation Windows : `git pull` ; `pnpm typecheck` ; `pnpm exec tsx --test tests/smn-121-report-history.test.ts` ; `pnpm i18n:check` ; `pnpm build`.
