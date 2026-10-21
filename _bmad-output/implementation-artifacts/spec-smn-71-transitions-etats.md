# SMN-71 — Transitions temporelles des états du Sprint

Jira : https://lmn24.atlassian.net/browse/SMN-71

## Implémentation
- Service de réconciliation idempotent `src/server/sprints/transitions.ts`.
- Avant début : état `planned`, aucune demande d'ouverture de capacité.
- Dès début : `active` avec événement `started` et demande de déclenchement de capacité `smn_sprint_capacity_trigger`, uniques par Sprint.
- Dès fin : `finished` automatiquement ; jamais `closed`.
- Si `auto_suspended=true`, le traitement automatique ne touche pas au Sprint. L'interface de remise volontaire en attente / reprise explicite sera livrée dans une Story ultérieure ; ce drapeau est prévu au schéma.
- À la réconciliation après une indisponibilité, événements `started`/`ended` rattachés aux bornes métier `business_at` et instant de traitement `processed_at`. Un événement ne prétend pas que l'application était réellement en fonctionnement à `business_at`.
- Les demandes de capacité restent `pending` tant qu'aucun processeur de capacité ne les a intégrées. **Ne pas assimiler cette demande à l'ouverture effective de la capacité.**
- Exécution opportuniste : `GET /api/admin/sprints/states` et page Admin de consultation. Il n'y a **pas** de planificateur autonome/daemon livré ici ; en l'absence de requêtes, l'état persisté ne change pas. Cette limite ne permet pas encore de déclarer entièrement respectée l'automatisation attendue au redémarrage.

## Validation restant à effectuer
Tester avant/pendant/après les dates, réexécuter deux fois sans doublons, arrêt/redémarrage, suspension volontaire, passage heure d'hiver/été, absence de clôture involontaire, début sans ouverture de capacité anticipée. Compiler le TypeScript et appliquer la migration PostgreSQL. Aucune exécution de GitHub Actions (indisponible).

État : code sur branche dédiée, recette et infrastructure de déclenchement autonome restant à compléter.
