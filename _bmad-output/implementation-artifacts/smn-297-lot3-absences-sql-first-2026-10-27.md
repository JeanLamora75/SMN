# SMN-297 — Isolation SQL des absences

Le lecteur contextualisé `readScopedTeamAbsences` n'appelle plus le lecteur global `readMemberAbsences`. Il vérifie d'abord l'affectation du membre à l'équipe, puis récupère exclusivement les absences couvertes par cette équipe et ne chevauchant aucune autre équipe. La projection conserve le contrat `AbsenceState`, les catégories et la limite de 500 lignes. Le test statique `tests/smn-297-scoped-absence-sql.test.ts` couvre ce contrôle de structure.

Tests de compilation et d'intégration SQL à exécuter sur PC ; aucun changement de schéma, verrou multiéquipes fermé, aucune fusion.
