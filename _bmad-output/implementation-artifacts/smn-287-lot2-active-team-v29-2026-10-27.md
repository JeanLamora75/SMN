# Lot 2 — Préférence d’équipe active en v29

Le service `src/server/teams/active.ts` accepte maintenant les installations v28 et v29. En v29, seules les équipes non archivées sont proposées et autorisées pour la préférence de l'administrateur. Les accès restent limités à son installation et à un compte admin actif ; la préférence d'équipe n'est pas une habilitation.

Deux tests unitaires ont été ajoutés pour le filtrage v29 et le refus de la sélection d'une équipe archivée. Ils ne sont pas exécutés ici.

Le sélecteur visible dans le shell reste verrouillé par `MULTI_TEAM_CONTEXT_READY=false`, et `PUT /api/admin/teams/active` reste désactivé tant que ce verrou est faux. Aucun déploiement, aucune migration et aucune activation réalisés.
