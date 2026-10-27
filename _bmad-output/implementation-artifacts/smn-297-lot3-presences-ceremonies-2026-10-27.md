# SMN-297 — Lot 3 : présences et durée réelle des cérémonies Scrum

Un service `src/server/teams/ceremony-attendance.ts` et une route PATCH contextualisée `api/admin/team-calendar/ceremonies/attendance` préparent la qualification *tenue / non tenue / annulée* et la durée réelle. Contrat : `teamId`, `ceremonyId`, `revision`, `status`, `reason`, `actualMinutes`. Contrôles : administrateur, résolution d'équipe, correspondance cérémonie-sprint-équipe, fermeture du Sprint, révision, échéance, transaction atomique et historisation des statuts et durées. Aucun DDL n'est effectué par cette route ; les tables nécessaires doivent préexister. Le verrou global reste `false`.

**Non terminé :** formulaire UI des présences, scénarios de concurrence, vérification d'intégrité des tables d'historique, tests PostgreSQL et exécution de la recette Windows. Les tests unitaires sont écrits mais non exécutés. Aucune migration, activation ou fusion.
