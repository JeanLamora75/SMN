# SMN-105 — Conservation des fiches lors de la replanification

Jira : https://lmn24.atlassian.net/browse/SMN-105

Publié sur main : le service `previewReschedule` renvoie désormais les risques et dépendances liés au Sprint et signale les échéances situées hors des nouvelles dates ; le formulaire de replanification affiche ces fiches, leurs liens et un avertissement non bloquant. Le contrôle porte sur la journée locale du Sprint. Le service `confirmReschedule` conserve les données métiers et ne met à jour que les dates du Sprint ainsi que son audit ; le verrou et la protection des Sprints clôturés restent actifs. Les corrections ultérieures explicites d'échéance passent par l'édition auditée du registre SMN-91. Libellés FR/EN et test de non-régression ajoutés.

Limites : seuls les Sprints Scrum disposant des liens SMN-97 sont couverts ; les périodes Kanban Epic 7 ne sont pas encore connectées. Le contrôle des snapshots PDF/Vn n'a pas été exercé en recette. Le test ajouté porte sur des invariants de source et ne remplace pas un test d'intégration PostgreSQL. Aucun test, typecheck, build ou essai navigateur exécuté ; Jira non clôturé.

Validation Windows : `git pull` ; `pnpm typecheck` ; `pnpm exec tsx --test tests/smn-105-registry-reschedule.test.ts` ; `pnpm i18n:check` ; `pnpm build`.
