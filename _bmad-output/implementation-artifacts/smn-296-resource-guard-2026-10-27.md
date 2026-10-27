# SMN-296 — Contrôle d'appartenance des ressources — 27 octobre 2026

## Travaux publiés
- Correction de `src/server/teams/resolve.ts` : variables SQL `modeColumn` et `activeClause` définies, filtrage de la préférence archivée compatible avec la v28.
- Nouveau `src/server/teams/resource-guard.ts` : garde d'appartenance admin/équipe active pour Sprint, période Kanban, affectation de membre ou équipe.
- Trois scénarios non exécutés : `tests/smn-296-resource-guard.test.ts`.

## Restrictions
Ce nouveau garde est une **primitive**, non une sécurisation globale : les routes métier ne l'appellent pas encore. Un contrôle d'appartenance doit être effectué dans la même transaction que l'écriture et les requêtes UPDATE/DELETE doivent toujours inclure le contexte d'équipe. Les lectures et mutations des membres (entité membre, distincte des affectations) demandent une analyse spécifique.

Le diagnostic et la migration v29 ne sont pas testés ; n'activer aucune écriture multiéquipes ni migration sur la base utilisateur. Ne pas considérer SMN-296 terminée.
